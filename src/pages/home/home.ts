import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgClass, isPlatformBrowser } from '@angular/common';
import { Title, Meta, DomSanitizer } from '@angular/platform-browser';
import { Apollo, gql } from 'apollo-angular';

interface HomeContent {
  page: string;
  videoUrls?: string[];
  sections: any[];
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, NgClass],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  readonly content = signal<HomeContent | null>(null);
  readonly loading = signal(true);
  readonly videoUrls = signal<string[]>([]);
  readonly currentVideoIndex = signal(0);
  readonly currentVideoUrl = computed(() => {
    const urls = this.videoUrls();
    const index = this.currentVideoIndex();
    return urls[index] || urls[0] || '';
  });
  private videoInterval: any;

  private readonly apollo = inject(Apollo);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  readonly sanitizer = inject(DomSanitizer);
  readonly posts = signal<any>(null);
  readonly error = signal<any>(null);
  readonly structuredData = signal<any>(null);

  constructor(private http: HttpClient) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', () => this.enableAutoplay(), { once: true });
    }

    // Try to load from external URL via proxy endpoint (bypasses CORS)
    // The proxy endpoint is defined in server.ts and only works in SSR mode
    // Fallback to local file on error (e.g., during dev with ng serve)
    this.http.get<HomeContent>('/api/home-content').subscribe({
      //this.http.get<HomeContent>('/home-content.json').subscribe({
      next: (data) => {
        this.content.set(data);
        if (data.videoUrls && data.videoUrls.length > 0) {
          this.videoUrls.set(data.videoUrls);
        }
        this.updateMetadata(data);
        this.updateStructuredData(data);
        this.loading.set(false);
      },
      error: (error) => {
        // Fallback to local file if proxy fails (e.g., in dev mode or if proxy is unavailable)
        console.warn('Error loading external home content via proxy, falling back to local file:', error);
        // Fallback to local file
        this.http.get<HomeContent>('/home-content.json').subscribe({
          next: (data) => {
            this.content.set(data);
            if (data.videoUrls && data.videoUrls.length > 0) {
              this.videoUrls.set(data.videoUrls);
            }
            this.updateMetadata(data);
            this.updateStructuredData(data);
            this.loading.set(false);
          },
          error: (fallbackError) => {
            console.error('Error loading local home content:', fallbackError);
            this.loading.set(false);
          }
        });
      }
    });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    setTimeout(() => {
      if (this.videoElement) {
        // Load the initial video
        const initialUrl = this.currentVideoUrl();
        if (initialUrl) {
          this.loadVideo(initialUrl);
        }
        this.videoElement.nativeElement.addEventListener('loadedmetadata', () => {
          this.attemptAutoplay();
          this.startVideoCarousel();
        });
        this.videoElement.nativeElement.addEventListener('ended', () => {
          this.nextVideo();
        });
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
    }
  }

  private attemptAutoplay() {
    if (!this.videoElement) return;
    const video = this.videoElement.nativeElement;
    if (!video.paused) {
      return;
    }

    video.muted = true;

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Video started playing successfully
      }).catch((error) => {
        if (error.name === 'NotAllowedError') {
          // Autoplay was prevented, will be enabled on user interaction
        } else if (error.name === 'NotSupportedError') {
          console.error('Video format not supported');
        } else if (error.name === 'NotReadableError') {
          console.error('Video file cannot be read');
        } else if (error.name === 'AbortError') {
          console.error('Video playback was aborted');
        } else {
          console.error('Unknown error occurred:', error);
        }
      });
    }
  }

  private enableAutoplay() {
    if (this.videoElement && this.videoElement.nativeElement.paused) {
      this.attemptAutoplay();
    }
  }

  private startVideoCarousel() {
    // Clear any existing interval
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
    }

    // Switch video every 10 seconds
    this.videoInterval = setInterval(() => {
      this.nextVideo();
    }, 10000);
  }

  switchToVideo(index: number) {
    const urls = this.videoUrls();
    if (index >= 0 && index < urls.length) {
      this.currentVideoIndex.set(index);
      this.loadVideo(urls[index]);

      // Reset the carousel timer
      this.startVideoCarousel();
    }
  }

  private nextVideo() {
    const urls = this.videoUrls();
    const currentIndex = this.currentVideoIndex();
    const nextIndex = (currentIndex + 1) % urls.length;
    this.switchToVideo(nextIndex);
  }

  private loadVideo(url: string) {
    if (!this.videoElement) return;

    const video = this.videoElement.nativeElement;
    video.src = url;
    video.load();

    video.addEventListener('loadeddata', () => {
      this.attemptAutoplay();
    }, { once: true });
  }

  getSection(type: string) {
    return this.content()?.sections.find(s => s.type === type);
  }

  private updateMetadata(content: HomeContent) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Get hero section for title and description
    const heroSection = content.sections?.find(s => s.type === 'hero');
    const pageTitle = heroSection?.title
      ? `${heroSection.title} | Oakwood Systems`
      : 'Oakwood Systems - Microsoft Solutions Partner';

    this.titleService.setTitle(pageTitle);

    // Update meta description
    const description = heroSection?.description ||
      'Oakwood Systems is a certified Microsoft Solutions Partner specializing in Data & AI, Cloud Infrastructure, Application Innovation, and Modern Work solutions.';
    this.metaService.updateTag({ name: 'description', content: description });

    // Open Graph tags
    this.metaService.updateTag({ property: 'og:title', content: heroSection?.title || 'Oakwood Systems' });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:url', content: 'https://oakwoodsys.com' });
    if (content.videoUrls && content.videoUrls.length > 0) {
      // Use first video thumbnail or a default image
      this.metaService.updateTag({ property: 'og:image', content: 'https://oakwoodsys.com/og-image.jpg' });
    }

    // Twitter Card tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: heroSection?.title || 'Oakwood Systems' });
    this.metaService.updateTag({ name: 'twitter:description', content: description });

    // Canonical URL
    let linkTag = document.querySelector('link[rel="canonical"]');
    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.setAttribute('rel', 'canonical');
      document.head.appendChild(linkTag);
    }
    linkTag.setAttribute('href', 'https://oakwoodsys.com');
  }

  private updateStructuredData(content: HomeContent) {
    const heroSection = content.sections?.find(s => s.type === 'hero');
    const servicesSection = content.sections?.find(s => s.type === 'services');

    const structuredDataObj = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Oakwood Systems',
      'url': 'https://oakwoodsys.com',
      'description': heroSection?.description || 'Microsoft Solutions Partner',
      'logo': 'https://oakwoodsys.com/logo.png',
      'sameAs': [
        // Add social media links if available
      ],
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'Customer Service',
        'url': 'https://oakwoodsys.com/contact-us'
      }
    };

    this.structuredData.set(structuredDataObj);
  }

  getStructuredDataJson(): string {
    const data = this.structuredData();
    return data ? JSON.stringify(data) : '';
  }
}

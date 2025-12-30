import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Input, OnChanges, OnDestroy, PLATFORM_ID, signal, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-video-hero',
  imports: [CommonModule, RouterLink],
  templateUrl: './video-hero.html',
  styleUrl: './video-hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoHero implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  @Input() videoUrls: string[] = [];
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() ctaPrimary?: { text: string; link: string; backgroundColor: string };
  @Input() ctaSecondary?: { text: string; link: string; borderColor: string };

  private readonly platformId = inject(PLATFORM_ID);
  private videoInterval: any;

  readonly videoUrlsSignal = signal<string[]>([]);
  readonly currentVideoIndex = signal(0);
  readonly currentVideoUrl = computed(() => {
    const urls = this.videoUrlsSignal();
    const index = this.currentVideoIndex();
    return urls[index] || urls[0] || '';
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['videoUrls'] && this.videoUrls.length > 0) {
      this.videoUrlsSignal.set(this.videoUrls);
      // Reload video if element is already initialized
      if (this.videoElement && this.videoUrlsSignal().length > 0) {
        const initialUrl = this.currentVideoUrl();
        if (initialUrl) {
          this.loadVideo(initialUrl);
        }
      }
    }
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', () => this.enableAutoplay(), { once: true });
    }

    // Initialize video URLs from input
    if (this.videoUrls.length > 0) {
      this.videoUrlsSignal.set(this.videoUrls);
    }

    setTimeout(() => {
      if (this.videoElement && this.videoUrlsSignal().length > 0) {
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
    const urls = this.videoUrlsSignal();
    if (index >= 0 && index < urls.length) {
      this.currentVideoIndex.set(index);
      this.loadVideo(urls[index]);

      // Reset the carousel timer
      this.startVideoCarousel();
    }
  }

  private nextVideo() {
    const urls = this.videoUrlsSignal();
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
}

import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface FooterSection {
  type: string;
  logo: {
    text: string;
    icon: string;
  };
  contact: {
    heading: string;
    phone: {
      text: string;
      link: string;
    };
    email: {
      text: string;
      link: string;
    };
  };
  socialMedia: Array<{
    name: string;
    link: string;
    icon: string;
  }>;
  links: {
    services: Array<{
      text: string;
      routerLink: string;
    }>;
    industries: Array<{
      text: string;
      routerLink: string;
    }>;
    resources: Array<{
      text: string;
      routerLink: string;
    }>;
    company: Array<{
      text: string;
      routerLink: string;
    }>;
  };
  copyright: string;
  policies: Array<{
    text: string;
    link: string;
  }>;
}

interface HomeContent {
  page: string;
  videoUrls?: string[];
  sections: FooterSection[];
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink, CommonModule, NgClass],
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer implements OnInit {
  private readonly http = inject(HttpClient);

  readonly footerData = signal<FooterSection | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    // Load footer data from home-content.json
    this.http.get<HomeContent>('/home-content.json').subscribe({
      next: (data) => {
        // Find the footer section
        const footerSection = data.sections.find(section => section.type === 'footer');
        if (footerSection) {
          this.footerData.set(footerSection);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading footer content:', error);
        this.loading.set(false);
      }
    });
  }
}

import { isPlatformServer } from "@angular/common";
import { inject, Injectable, LOCALE_ID, PLATFORM_ID } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";

@Injectable({
  providedIn: "root",
})
export class StructuredDataService {
  locale: string = inject(LOCALE_ID);
  platformId = inject(PLATFORM_ID);

  isServer: boolean;

  structuredDataIdPrefix = "structured-data-";

  constructor(private meta: Meta, private titleService: Title) {
    this.isServer = isPlatformServer(this.platformId);
  }

  addStructuredData(id: string, data: any) {
    if (this.isServer) {
      return;
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = this.structuredDataIdPrefix + id;
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  removeStructuredData(id: string) {
    if (this.isServer) {
      return;
    }

    const script = document.getElementById(this.structuredDataIdPrefix + id);
    if (script) {
      script.remove();
    }
  }
}

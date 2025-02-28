import {
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  _MatSlideToggleRequiredValidatorModule,
  MatSlideToggleModule,
} from "@angular/material/slide-toggle";
import { CodeBlockComponent } from "../../code-block/code-block.component";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MatChipsModule } from "@angular/material/chips";
import { APP_BASE_HREF, DOCUMENT, isPlatformBrowser } from "@angular/common";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { LocaleCode } from "../../../db/models/Interfaces";
import { MatSelectModule } from "@angular/material/select";
import { languageCodes } from "../../../scripts/Languages";

type EmbedType = "map" | "event";

@Component({
  selector: "app-embed-page",
  imports: [
    MatSlideToggleModule,
    FormsModule,
    _MatSlideToggleRequiredValidatorModule,
    MatButtonModule,
    ReactiveFormsModule,
    CodeBlockComponent,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: "./embed-page.component.html",
  styleUrls: ["./embed-page.component.scss"],
  providers: [
    {
      provide: APP_BASE_HREF,
      useFactory: (platformId: Object) => {
        if (isPlatformBrowser(platformId)) {
          const pathSegments = window.location.pathname.split("/");
          return window.location.origin;
        }
        return "/"; // fallback for server-side
      },
      deps: [PLATFORM_ID],
    },
  ],
})
export class EmbedPageComponent {
  sanitizer = inject(DomSanitizer);
  // doc = inject(DOCUMENT);
  baseHref = inject(APP_BASE_HREF);

  supportedLanguageCodes = ["en", "de", "de-CH", "fr", "it", "nl", "es"]; // TODO get supported languages somehow
  languages = languageCodes;
  embedLanguage = signal<LocaleCode | "auto">("auto");

  showSatelliteToggle = signal<boolean>(true);
  showGeolocation = signal<boolean>(false);

  eventId = signal<string>("swissjam25");
  showEventHeader = signal<boolean>(false);

  defaultEmbedType: EmbedType = "event";
  embedTypes: EmbedType[] = ["event"]; // "map",
  embedTypeName: Record<EmbedType, string> = {
    map: $localize`Map`,
    event: $localize`Event`,
  };

  tab = signal<EmbedType>(this.defaultEmbedType);

  unsafeIframeUrl = computed<string>(() => {
    const baseUrl = `${this.baseHref}`;
    const tab = this.tab();
    const language = this.embedLanguage();

    let url =
      baseUrl + (language === "auto" ? "" : "/" + language) + "/embedded/";

    switch (tab) {
      case "map":
        url += "map/";
        break;
      case "event":
        url += "event/";
        url += this.eventId();
        url += "?showHeader=" + (this.showEventHeader() ? "true" : "false");
        break;
    }

    return url;
  });

  safeIframeUrl = computed<SafeResourceUrl>(() => {
    const url = this.unsafeIframeUrl();
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  iframeCode = computed<string>(() => {
    return `<iframe src="${this.unsafeIframeUrl()}"></iframe>`;
  });
}

import { Component } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import {
  _MatSlideToggleRequiredValidatorModule,
  MatSlideToggleModule,
} from "@angular/material/slide-toggle";

@Component({
  selector: "app-embed-page",
  imports: [
    MatSlideToggleModule,
    FormsModule,
    _MatSlideToggleRequiredValidatorModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: "./embed-page.component.html",
  styleUrl: "./embed-page.component.scss",
})
export class EmbedPageComponent {
  showSatelliteToggle: boolean = true;
  showGeolocation: boolean = false;
}

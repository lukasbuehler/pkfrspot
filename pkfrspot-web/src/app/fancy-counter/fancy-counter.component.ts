import { animate, style, transition, trigger } from "@angular/animations";
import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "app-fancy-counter",
  templateUrl: "./fancy-counter.component.html",
  styleUrls: ["./fancy-counter.component.scss"],
  animations: [
    trigger("digitChange", [
      transition(
        ":enter",
        [
          style({
            opacity: 0,
            transform: "translateY({{incrementMinus}}1em)",
          }),
          animate("200ms ease", style({ opacity: 1, transform: "none" })),
        ],
        { params: { incrementMinus: "-" } }
      ),
      transition(
        ":leave",
        [
          style({ position: "absolute" }),
          animate(
            "50ms ease",
            style({
              opacity: 0,
              //transform: "scale(0)",
              //transform: "translateY({{decrementMinus}}1em)",
            })
          ),
        ],
        { params: { decrementMinus: "" } }
      ),
    ]),
  ],
})
export class FancyCounterComponent implements OnInit {
  private _number: number = 0;
  previousNumber: number = 0;

  @Input() set number(newNumber: number) {
    this.previousNumber = this._number;
    this._number = newNumber;
  }

  get number() {
    return this._number;
  }

  constructor() {}

  ngOnInit(): void {}

  getMinusIfIncrementing(newNumber: number, enterAnimation: boolean) {
    // We want to return a minus if we are incrementing
    let numberIsGreater: boolean = newNumber > this.previousNumber;

    let minus =
      !(numberIsGreater || enterAnimation) ||
      (numberIsGreater && enterAnimation)
        ? "-"
        : "";

    return minus;
  }
}

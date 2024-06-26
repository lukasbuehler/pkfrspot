import { Component, OnInit } from "@angular/core";
import { PageHeaderComponent } from "../page-header/page-header.component";
import { MatDivider } from "@angular/material/divider";
import { MatIcon } from "@angular/material/icon";
import { NgIf } from "@angular/common";
import { MatSelectionList, MatListSubheaderCssMatStyler, MatListOption } from "@angular/material/list";
import { MatDrawerContainer, MatDrawer } from "@angular/material/sidenav";

@Component({
    selector: "app-community-page",
    templateUrl: "./community-page.component.html",
    styleUrls: ["./community-page.component.scss"],
    standalone: true,
    imports: [
        MatDrawerContainer,
        MatDrawer,
        MatSelectionList,
        MatListSubheaderCssMatStyler,
        MatListOption,
        NgIf,
        MatIcon,
        MatDivider,
        PageHeaderComponent,
    ],
})
export class CommunityPageComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  teams = [
    {
      name: "Storror",
      member_count: 7,
      picture_src:
        "https://pbs.twimg.com/profile_images/762876325828767744/Z-CbjcuO.jpg",
    },
    {
      name: "Team 2",
      member_count: 4,
    },
  ];

  groups = [
    {
      name: "Group 1",
      member_count: 34,
      picture_src: "",
    },
  ];
}

import { NodeJsSyncHost } from "@angular-devkit/core/node";
import { workspaces } from "@angular-devkit/core";

async function demonstrate() {
  const host = workspaces.createWorkspaceHost(new NodeJsSyncHost());
  const { workspace } = await workspaces.readWorkspace("../", host);

  const apps = [];
  workspace.projects.forEach((value, key) => {
    if (value.extensions.projectType === "application") apps.push(key);
  });

  console.log(apps);
}

demonstrate();

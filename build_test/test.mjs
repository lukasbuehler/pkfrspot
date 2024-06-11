import { NodeJsSyncHost } from "@angular-devkit/core/node";
import { workspaces } from "@angular-devkit/core";

async function demonstrate() {
  const host = workspaces.createWorkspaceHost(new NodeJsSyncHost());
  const { workspace } = await workspaces.readWorkspace("../", host);

  console.log(workspace.projects);

  const apps = [];
  workspace.projects.forEach((value, key) => {
    if (value.extensions.projectType === "application") apps.push(key);
  });

  console.log(apps);

  const project = apps[0];
  if (apps.length > 1 || !project)
    throw new Error("Unable to determine the application to deploy");

  const workspaceProject = workspace.projects.get(project);

  console.log(workspaceProject.targets);
}

demonstrate();

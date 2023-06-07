import {
  component$,
  useComputed$,
  useSignal,
  useStylesScoped$,
} from "@builder.io/qwik";
import { useLocation, routeLoader$ } from "@builder.io/qwik-city";
import CSS from "./index.css?inline";

import type { paths } from "@octokit/openapi-types";

type OrgReposResponse =
  paths["/users/{username}/repos"]["get"]["responses"]["200"]["content"]["application/json"];

export const useRepositories = routeLoader$(async ({ params, env }) => {
  console.log("Loading repositories for:", params.user);
  const response = await fetch(
    `https://api.github.com/users/${params.user}/repos?per_page=100`,
    {
      headers: {
        "User-Agent": "Qwik Workshop",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: "Bearer " + env.get("PRIVATE_GITHUB_ACCESS_TOKEN"),
      },
    }
  );
  return (await response.json()) as OrgReposResponse;
});

export default component$(() => {
  useStylesScoped$(CSS);
  const location = useLocation();
  const repositories = useRepositories();
  const filter = useSignal("");
  const filteredRepositories = useComputed$(() => {
    console.log("Filtering");
    return repositories.value.filter((repo) =>
      repo.name.includes(filter.value)
    );
  });
  return (
    <div>
      <h1>GitHub Repo: {location.params.user}</h1>
      <input type="text" bind:value={filter} />
      <ul class="card-list">
        {filteredRepositories.value.map((repo) => (
          <li key={repo.id} class="card-item">
            <a href={`/github/${location.params.user}/${repo.name}`}>
              {repo.name}
            </a>{" "}
            - {repo.description}
          </li>
        ))}
      </ul>
    </div>
  );
});

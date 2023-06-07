import { component$ } from "@builder.io/qwik";
import {
  Form,
  Link,
  routeAction$,
  routeLoader$,
  z,
  zod$,
} from "@builder.io/qwik-city";
import type { paths } from "@octokit/openapi-types";
import { Session, createServerClient } from "supabase-auth-helpers-qwik";

type OrgRepoResponse =
  paths["/repos/{owner}/{repo}"]["get"]["responses"]["200"]["content"]["application/json"];

export const useRepository = routeLoader$(async ({ params, env }) => {
  const user = params.user;
  const repo = params.repo;
  const _fetch = fetch;

  const response = await _fetch(
    `https://api.github.com/repos/${user}/${repo}`,
    {
      headers: {
        "User-Agent": "Qwik Workshop",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: "Bearer " + env.get("PRIVATE_GITHUB_ACCESS_TOKEN"),
      },
    }
  );
  const repository = (await response.json()) as OrgRepoResponse;
  return repository;
});

export const useIsFavorite = routeLoader$(async (requestEv) => {
  const { params, sharedMap } = requestEv;
  const user = params.user;
  const repo = params.repo;
  const session = sharedMap.get("session") as Session | null;
  const email = session?.user?.email;
  if (email) {
    const supabaseClient = createServerClient(
      requestEv.env.get("PRIVATE_SUPABASE_URL")!,
      requestEv.env.get("PRIVATE_SUPABASE_ANON_KEY")!,
      requestEv
    );
    const { data: favorites, error } = await supabaseClient
      .from("favorite")
      .select("*")
      .eq("email", email)
      .eq("user", user)
      .eq("repo", repo);
    if (error) throw error;
    return favorites ? favorites.length > 0 : 0;
  }
  return false;
});

const useSetFavoriteAction = routeAction$(
  async ({ favorite }, requestEv) => {
    const { params, sharedMap } = requestEv;
    const user = params.user;
    const repo = params.repo;
    const session = sharedMap.get("session") as Session | null;
    const email = session?.user?.email;
    if (email) {
      const supabaseClient = createServerClient(
        requestEv.env.get("PRIVATE_SUPABASE_URL")!,
        requestEv.env.get("PRIVATE_SUPABASE_ANON_KEY")!,
        requestEv
      );
      if (favorite) {
        const { data, error } = await supabaseClient
          .from("favorite")
          .upsert([{ email, user, repo }]);
        if (error) throw error;
      } else {
        const { data, error } = await supabaseClient
          .from("favorite")
          .delete()
          .eq("email", email)
          .eq("user", user)
          .eq("repo", repo);
        if (error) throw error;
      }
    }
  },
  zod$({
    favorite: z.coerce.boolean(),
  })
);

export default component$(() => {
  const repo = useRepository();
  const isFavorite = useIsFavorite();
  const setFavoriteAction = useSetFavoriteAction();
  return (
    <div>
      <h1>
        Github:{" "}
        <Link href={`/github/${repo.value.owner.login}`}>
          {repo.value.owner.login}
        </Link>
        /{repo.value.name}
      </h1>
      <Form action={setFavoriteAction}>
        <input
          type="hidden"
          name="favorite"
          value={isFavorite.value ? "" : "true"}
        />
        <button>{isFavorite.value ? "★" : "☆"}</button>
      </Form>
      <p>{repo.value.description}</p>
    </div>
  );
});

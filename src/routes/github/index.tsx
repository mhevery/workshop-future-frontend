import {
  Resource,
  component$,
  useComputed$,
  useResource$,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import { Session, createServerClient } from "supabase-auth-helpers-qwik";
import type { paths } from "@octokit/openapi-types";

type SearchUsersResponse =
  paths["/search/users"]["get"]["responses"]["200"]["content"]["application/json"];

export const useFavorites = routeLoader$(async (requestEv) => {
  const { params, sharedMap } = requestEv;
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
      .eq("email", email);
    if (error) throw error;
    return favorites as Array<{ user: string; repo: string; email: string }>;
  }
  return [];
});

export default component$(() => {
  console.log("render: <Search/>");
  const favorites = useFavorites();
  const query = useSignal("");
  const debouncedQuery = useSignal("");
  useTask$(async ({ track, cleanup }) => {
    console.log("Debounce");
    const value = track(() => query.value);
    const timeout = setTimeout(() => (debouncedQuery.value = value), 500);
    cleanup(() => clearTimeout(timeout));
  });
  const users = useResource$(async ({ track }) => {
    const query = track(() => debouncedQuery.value);
    if (!query) return [];
    return queryOrgs(query);
  });
  return (
    <div>
      <h1>My Favorites</h1>
      <ul>
        {favorites.value.map((favorite, idx) => (
          <li key={idx}>
            <a href={`/github/${favorite.user}/${favorite.repo}/`}>
              {favorite.user}/{favorite.repo}
            </a>
          </li>
        ))}
      </ul>
      <h1>Search Repos</h1>
      <input type="text" onInput$={(e, t) => (query.value = t.value)} />
      <Resource
        value={users}
        onPending={() => <div>Loading...</div>}
        onResolved={(users) => (
          <ul>
            {users.map((user, idx) => (
              <li key={idx}>{user.login}</li>
            ))}
          </ul>
        )}
      />
    </div>
  );
});
const queryOrgs = server$(async function queryOrgs(query: string) {
  const response = await fetch(
    "https://api.github.com/search/users?q=" + query,
    {
      headers: {
        "User-Agent": "Qwik Workshop",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: "Bearer " + this.env.get("PRIVATE_GITHUB_ACCESS_TOKEN"),
      },
    }
  );
  const users = (await response.json()) as SearchUsersResponse;
  return users.items;
});

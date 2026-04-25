import { Locale } from "../app/i18n";
import { getGitHubProfilePayload } from "../app/github";
import GitHubProfileClient from "./GitHubProfileClient";

export default async function GitHubProfile({
  username,
  locale,
}: {
  username: string;
  locale: Locale;
}) {
  const payload = await getGitHubProfilePayload(username, locale);

  return (
    <GitHubProfileClient
      locale={locale}
      profile={payload.profile}
      repos={payload.repos}
      error={payload.error}
    />
  );
}

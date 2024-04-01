import type {bcPlaylist, bcVideo} from "@customTypes/types";
import {playbackApi, type HttpResponse, type PlaylistResponse} from "./bcApi";

export async function getPlaylistData(
  origin: string,
  playlist: string
): Promise<HttpResponse<bcPlaylist, void> | undefined> {
  try {
    // const urlBase = import.meta.env.PROD ? origin : "http://127.0.0.1:8788";
    const policyKey = import.meta.env.POLICY_KEY;
    const accountId = import.meta.env.ACCOUNT_ID;

    const pbApi = new playbackApi({
      baseUrl: "https://edge.api.brightcove.com/playback/v1",
      baseApiParams: {
        headers: {
          Accept: `application/json;pk=${policyKey}`,
        },
      },
    });
    const res = (await pbApi.accounts.getPlaylistsByIdOrReferenceId(
      accountId,
      `ref:${playlist}`,
      {
        limit: 2000,
      }
    )) as HttpResponse<bcPlaylist, void>;
    return res;
  } catch (error) {
    console.error(error);
  }
}

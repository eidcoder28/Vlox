import templates from "@app/templates.js";
import { renderProfilePosts } from "@app/users/profile-feed.js";
import {
    sendRequest,
    capitalize,
    lockEvent,
    config,
    quickInfo,
    $,
    Alert,
    Swal
} from "@app/utils.js";

export default async function showProfile(id) {
    const response = await sendRequest({
        url: `/api/v1/users/${id}/profile`
    });

    if (!response.success) return Alert.error({ text: response.error });

    const user = response.user || {};
    const state = {
        skip: 0,
        container: null,
        user: {
            username: capitalize(user.username) || "User",
            id: user.id,
            me: user.id === quickInfo?.id
        }
    }

    Swal.fire({
        titleText: `Hello, ${state.user.username}!`,
        html: templates.USER_PROFILE(state),
        confirmButtonText: "Close",
        stopKeydownPropagation: false,
        didOpen: () => {
            const $popup = $(Swal.getPopup());
            state.container = $popup.find("#user-posts-container");
            
            $popup.find("#profile-load-posts-btn").on("click", lockEvent(async function () {
                await renderProfilePosts(state);
            }));

            $popup.find("#profile-posts-prev-btn").on("click", lockEvent(async function () {
                if (state.skip <= 0) return;
                state.skip -= config.USER_POSTS_LIMIT;
                await renderProfilePosts(state);
            }));

            $popup.find("#profile-posts-next-btn").on("click", lockEvent(async function () {
                if (state.skip + config.USER_POSTS_LIMIT > config.PAGINATION_MAX_SKIP) return;
                if (!$(state.container).find("#profile-load-posts-btn").length) {
                    state.skip += config.USER_POSTS_LIMIT;
                }
                
                await renderProfilePosts(state);
            }));
        }
    });
}

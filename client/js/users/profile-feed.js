import PostEditor from "@app/posts/post-editor.js";
import {
    copy,
    renderSafeHtml,
    generatePostLink,
    sendRequest,
    $,
    capitalize,
    lockEvent,
    Alert,
    Swal
} from "@app/utils.js";

export async function getProfilePosts(userId, skip) {
    const response = await sendRequest({
        url: `/api/v1/users/${userId}/posts/?skip=${skip}`
    });

    return response;
}

export async function renderProfilePosts(state = {}, preFetchedResponse = null) {
    const response = preFetchedResponse || await getProfilePosts(state.user.id, state.skip);
    if (response && !response.success) return Alert.error({ text: response.error });
    $(state.container).empty();
    const $popup = $(Swal.getPopup());

    const hasPosts = Array.isArray(response?.posts) && response.posts.length > 0;
    $popup.find("#profile-posts-prev-btn").prop("disabled", state.skip <= 0);
    $popup.find("#profile-posts-next-btn").prop("disabled", !hasPosts);

    if (!hasPosts) {
        $("<div>")
            .addClass("state-nothing-found")
            .html("<b>No posts yet.</b>")
            .appendTo(state.container);
        return;
    }

    const fragment = new DocumentFragment();

    response.posts.forEach(post => {
        const safePost = post || {};
        const card = $("<div>").addClass("card").appendTo(fragment);
        const header = $("<div>").addClass("space-between").appendTo(card);

        $("<h2>")
            .addClass("overflow")
            .text(capitalize(safePost.title) || "Untitled post")
            .appendTo(header);

        $("<i>")
            .addClass("fas fa-link post-icon")
            .attr({ role: "button", tabindex: "0" })
            .on("click", async function () {
                copy(generatePostLink(safePost.id));
            })
            .appendTo(header);

        $("<div>")
            .addClass("post-content")
            .html(renderSafeHtml(safePost.content) || "Not content found")
            .appendTo(card);

        if (state.user.me) {
            const buttons = $("<div>").addClass("center-overflow");
            card.append(buttons);

            $("<button>")
                .addClass("btn-danger w-full")
                .html("<i class='fas fa-trash'></i>")
                .on("click", lockEvent(async function () {
                    const response = await sendRequest({
                        url: `/api/v1/posts/${safePost.id}/delete`,
                        method: "DELETE"
                    });

                    if (!response.success) return Alert.error({ text: response.error });
                    Alert.success({ text: "Post deleted!" });
                }))
                .appendTo(buttons);

            $("<button>")
                .addClass("w-full")
                .html("<i class='fas fa-edit'></i>")
                .on("click", lockEvent(async function () {
                    const instance = new PostEditor("Update post", post);
                    const result = await instance.open();
                    if (!result.isConfirmed) return;

                    const response = await sendRequest({
                        url: `/api/v1/posts/${safePost.id}/update`,
                        method: "PUT",
                        body: result.value
                    });

                    if (!response.success) return Alert.error({ text: response.error });
                    if (!response.changed) return Alert.info({ text: "No changed were made!" });
                    
                    Alert.success({ text: "Post updated!" });
                }))
                .appendTo(buttons);

        }
    });

    $(state.container).append(fragment);
}
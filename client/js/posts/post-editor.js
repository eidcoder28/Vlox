import { config, $, Swal, validator } from "@app/utils.js";
import templates from "@app/templates.js";
import errors from "@shared/errors.js";

export default class PostEditor {
    #instance;

    constructor(title = "Post editor", initial = {}) {
        this.title = title;
        this.initial = initial;
        this.#instance = null;
    }

    async open() {
        this.#instance = Swal.fire({
            title: this.title,
            html: templates.POST_EDITOR(),
            showCancelButton: true,
            confirmButtonText: "Submit",
            didOpen: () => {
                const $popup = $(Swal.getPopup());
                
                $popup.find("#post-editor-title")
                    .val(this.initial.title || "")
                    .attr("maxLength", config.POST_TITLE_MAX_LENGTH);

                $popup.find("#post-editor-content")
                    .val(this.initial.content || "")
                    .attr("maxLength", config.POST_CONTENT_MAX_LENGTH);
            },

            didDestroy: () => {
                this.#instance = null;
            },

            preConfirm: () => {
                const $popup = $(Swal.getPopup());
                const title = $popup.find("#post-editor-title").val().trim();
                const content = $popup.find("#post-editor-content").val().trim();

                if (validator.isEmpty(title)) {
                    return Swal.showValidationMessage(errors.VALIDATION.REQUIRED("title"));
                }

                if (validator.isEmpty(content)) {
                    return Swal.showValidationMessage(errors.VALIDATION.REQUIRED("content"));
                }

                if (
                    title === (this.initial.title || "").trim() &&
                    content === (this.initial.content || "").trim()
                ) {
                    return Swal.showValidationMessage("The values are the same as before.");
                }

                return { title, content };
            }
        });

        try {
            return await this.#instance;
        } finally {
            this.#instance = null;
        }
    }

    close() {
        this.#instance?.close();
        this.#instance = null;
    }
}
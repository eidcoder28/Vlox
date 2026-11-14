import showProfile from "@app/users/profile.js";
import templates from "@app/templates.js";
import {
    getLoginError,
    getSignupError,
    toggleAuthButtons,
    handleAuthSuccess
} from "@app/users/signup-helpers.js";
import {
    sendRequest,
    lockEvent,
    config,
    quickInfo,
    $,
    Alert,
    Swal
} from "@app/utils.js";

const signUpBtn = $("#signup-btn");
const signOutBtn = $("#signout-btn");
const profileBtn = $("#profile-btn");

const modalRoutes = {
    "login": showLoginModal,
    "signup": showSignUpModal
}

$(document).on("click", ".link-swal-auth", function () {
    const target = $(this).data("target");
    if (modalRoutes[target]) modalRoutes[target]();
});

async function showLoginModal() {
    const result = await Swal.fire({
        html: templates.USER_LOGIN(),
        stopKeydownPropagation: false,
        showCancelButton: true,
        confirmButtonText: "Submit",
        cancelButtonText: "Cancel",
        didOpen: () => {
            const $popup = $(Swal.getPopup());
            $popup.find("#login-username").attr("maxLength", config.USERNAME_MAX_LENGTH);
            $popup.find("#login-password").attr("maxLength", config.PASSWORD_MAX_LENGTH);
        },
        preConfirm: () => {
            const $popup = $(Swal.getPopup());
            const username = $popup.find("#login-username").val().trim();
            const password = $popup.find("#login-password").val().trim();

            const error = getLoginError(username, password);
            if (error) return Swal.showValidationMessage(error);

            return { username, password };
        }
    });

    if (!result.isConfirmed) return;

    const response = await sendRequest({
        url: "/api/v1/auth/login",
        method: "POST",
        body: result.value
    });

    if (!response.success) return Alert.error({ text: response.error });
    await handleAuthSuccess("Logged in successfully!");
}

async function showSignUpModal() {
    const result = await Swal.fire({
        html: templates.USER_SIGNUP(),
        stopKeydownPropagation: false,
        showCancelButton: true,
        didOpen: () => {
            const $popup = $(Swal.getPopup());
            $popup.find("#signup-username").attr("maxLength", config.USERNAME_MAX_LENGTH);
            $popup.find("#signup-password").attr("maxLength", config.PASSWORD_MAX_LENGTH);
            $popup.find("#signup-email").attr("maxLength", config.EMAIL_MAX_LENGTH);
        },

        preConfirm: () => {
            const $popup = $(Swal.getPopup());
            const username = $popup.find("#signup-username").val().trim();
            const password = $popup.find("#signup-password").val().trim();
            const email = $popup.find("#signup-email").val().trim();

            const error = getSignupError(username, password, email);
            if (error) return Swal.showValidationMessage(error);

            return { username, password, email };
        }
    });
    
    if (!result.isConfirmed) return;

    const response = await sendRequest({
        url: "/api/v1/auth/signup",
        method: "POST",
        body: result.value
    });

    if (!response.success) return Alert.error({ text: response.error });
    await handleAuthSuccess("Account created successfully!");
}

signUpBtn.on("click", lockEvent(async function () {
    await showSignUpModal();
}));

signOutBtn.on("click", lockEvent(async function () {
    const response = await sendRequest({
        url: "/api/v1/auth/signout",
        method: "DELETE"
    });

    if (!response.success) return Alert.error({ text: response.error });
    await handleAuthSuccess("You have been logged out!");
}));

profileBtn.on("click", lockEvent(async function () {
    await showProfile(quickInfo?.id);
}));

toggleAuthButtons();
window.addEventListener("DOMContentLoaded", (e) => {
    let profileButton = document.querySelector(".profile-button");
    let chapterListSidePanel = document.querySelector(".reader-side-panel");
    let chapterListToggle = document.querySelector(".reader-side-panel-toggle");
    let sidePanel = document.querySelector(".side-panel");
    let genderInputs = document.querySelectorAll(".gender-input");
    let modalContainer = document.querySelector(".modal-container");
    let searchIcon = document.querySelector(".search-icon");
    let searchForm = document.querySelector(".search-form");
    let searchInput = document.querySelector(".search-input");
    let sortableList = document.querySelector(".sortable-list");
    let dashboardNovelCovers = document.querySelectorAll(
        ".dashboard-item-cover"
    );
    let dashboardActionSubmit = document.querySelector(
        "#dashboard-action-submit"
    );
    let sortable = undefined;

    const CHAPTER_REORDER_ENDPOINT = "/writer/reorder";
    const CHAPTER_LIKE_ENDPOINT = "/reader/like_chapter";
    const CHAPTER_UNLIKE_ENDPOINT = "/reader/unlike_chapter";

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === name + "=") {
                    cookieValue = decodeURIComponent(
                        cookie.substring(name.length + 1)
                    );
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Default values
    if (dashboardActionSubmit) {
        dashboardActionSubmit.disabled = true;
    }

    // Like-Unlike Chapters
    try {
        let chapterLikeButton = document.getElementById("chapter-like-button");
        chapterLikeButton.addEventListener("click", (e) => {
            let data = {};
            data["chapter_id"] =
                chapterLikeButton.getAttribute("data-chapter-id");
            chapterLikeButton.disabled = true;
            chapterLikeButton.innerHTML = "...";
            const ENDPOINT =
                chapterLikeButton.getAttribute("data-is-liked") === "True" ?
                CHAPTER_UNLIKE_ENDPOINT :
                CHAPTER_LIKE_ENDPOINT;
            fetch(ENDPOINT, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "X-CSRFToken": getCookie("csrftoken"),
                    },
                    body: JSON.stringify({
                        payload: data,
                    }),
                })
                .then((response) => response.json())
                .then((data) => {
                    const NEW_STATUS =
                        data["status"] === "liked" ? "True" : "False";
                    const NEW_BUTTON_TEXT =
                        data["status"] === "liked" ? "J'aime plus" : "J'aime";
                    chapterLikeButton.setAttribute("data-is-liked", NEW_STATUS);
                    chapterLikeButton.innerHTML = NEW_BUTTON_TEXT;
                })
                .catch((e) => {
                    console.error(e);
                })
                .finally(() => {
                    chapterLikeButton.disabled = false;
                });
        });
    } catch (e) {
        console.error(e);
    }

    // Select Novels on Writer Dashboard
    dashboardNovelCovers.forEach((cover) => {
        cover.addEventListener("click", (e) => {
            e.preventDefault();
            const NOVEL_ID = e.target.getAttribute("data-item-id");
            if (NOVEL_ID === undefined) {
                throw new Error("Could not get item id");
            }
            let correspondingCheckbox = document.querySelector(
                `#check-item-${NOVEL_ID}`
            );
            if (!correspondingCheckbox) {
                throw new Error("Could not get checkbox related to item id");
            }
            correspondingCheckbox.toggleAttribute("checked");
            e.target.classList.toggle("dashboard-item-checked");

            // Toggle Submit
            let dashboardItemChecks = document.querySelectorAll(
                ".dashboard-item-check"
            );

            // Make the submit clickable accordingly
            dashboardItemChecks = Array.from(dashboardItemChecks);
            const areChecked = (element) => element.checked;
            dashboardActionSubmit.disabled = dashboardItemChecks.some(
                    areChecked
                ) ?
                false :
                true;
        });
    });

    // Search
    searchForm.addEventListener("submit", (e) => {
        if (searchInput.value == "") {
            return;
        }
    });
    searchIcon.addEventListener("click", (e) => {
        e.preventDefault();
        if (searchInput.value == "") {
            return;
        }
        searchForm.submit();
    });

    // Reorder Chapters
    const SORTABLE_OPTIONS = {
        animation: 150,
        handle: ".fa-bars",
        sort: true,
        dataIdAttr: "data-id",
        onEnd: function(e) {
            saveNewOrder();
        },
    };

    try {
        sortable = Sortable.create(sortableList, SORTABLE_OPTIONS);
    } catch (e) {
        console.error("Sortable does not seem to work here...");
    }

    const saveNewOrder = () => {
        let sorted = sortable.toArray();
        let data = {};
        sorted.map((novel_id, order) => {
            data[order] = novel_id;
        });

        fetch(CHAPTER_REORDER_ENDPOINT, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify({
                    payload: data,
                }),
            })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
            })
            .catch((e) => {
                console.error(e);
            });
    };

    //Toggle Chapter list in reader
    try {
        chapterListToggle.addEventListener("click", (e) => {
            e.preventDefault();
            chapterListSidePanel.classList.toggle("reader-side-panel-hidden");
        });
    } catch (e) {
        console.error(e);
    }

    // Toggle Side-Panel
    profileButton.addEventListener("click", (e) => {
        e.preventDefault();
        sidePanel.classList.toggle("side-panel-hidden");
    });

    // Signup Form
    genderInputs.forEach((input) => {
        function clearGenderRadios() {
            let genderRadios = document.querySelectorAll(".gender-radio");
            let genderIcons = document.querySelectorAll(".gender-icon");

            genderRadios.forEach((radio) => {
                radio.checked = false;
            });

            genderIcons.forEach((icon) => {
                icon.classList.remove("gender-is-selected");
            });
        }
        input.addEventListener("click", (e) => {
            e.preventDefault();
            let gender = e.target.getAttribute("data-gender");
            if (gender) {
                switch (gender) {
                    case "H":
                        clearGenderRadios();
                        document.getElementById("gender-male").checked = true;
                        document
                            .querySelector(".fa-male")
                            .classList.add("gender-is-selected");
                        break;

                    case "F":
                        clearGenderRadios();
                        document.getElementById("gender-female").checked = true;
                        document
                            .querySelector(".fa-female")
                            .classList.add("gender-is-selected");
                        break;

                    default:
                        break;
                }
            }
        });
    });

    // Modals
    document.querySelectorAll(".item-action-delete").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            modalContainer.classList.add("modal-container-show");
            document
                .querySelector(".btn-cancel")
                .addEventListener("click", (e) => {
                    e.preventDefault();
                    modalContainer.classList.remove("modal-container-show");
                });
            document
                .querySelector(".btn-confirm")
                .addEventListener("click", (e) => {
                    const submitLink = btn.getAttribute("data-url");
                    if (submitLink) {
                        document.querySelector(".btn-confirm").href =
                            submitLink;
                        document.querySelector(".btn-confirm").click();
                    }
                });
        });
    });

    //Richtext
    let $input = document.querySelector("#richtext_input");

    if (!$input) {
        console.error("Input field not found");
        return;
    }

    if (!quill) {
        console.error("Quill is not imported, cannot save text.");
        return;
    }

    $input.value = quill.root.innerHTML;
    quill.on("text-change", function(delta, oldDelta, source) {
        $input.value = quill.root.innerHTML;
    });
});
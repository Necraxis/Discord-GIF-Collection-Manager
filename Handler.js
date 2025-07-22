document.addEventListener("DOMContentLoaded", function () {
    const AppData = {
        AuthenticationToken: "",
        GifItemList: [],
        CollectedData: [],
        PreviousActions: [],
        OperationMode: "",
        SortingHandler: undefined,
        CollectionSortHandler: undefined,
        ActiveOperations: new Set()
    }

    let Interface = {
        StartScreen: document.getElementById("LoginSection"),
        AuthScreen: document.getElementById("TokenSection"),
        MainActionsScreen: document.getElementById("DiscordActionsSection"),
        DataInputScreen: document.getElementById("CollectionInputSection"),
        EditorScreen: document.getElementById("LayoutSection"),
        OutputScreen: document.getElementById("ExportSection"),

        StartWithTokenBtn: document.getElementById("TokenLoginBtn"),
        StartLocalBtn: document.getElementById("LocalEditBtn"),
        SubmitTokenBtn: document.getElementById("PasteTokenBtn"),
        FetchCurrentBtn: document.getElementById("GetCurrentCollectionBtn"),
        EraseAllBtn: document.getElementById("ClearCollectionBtn"),
        OverwriteBtn: document.getElementById("ReplaceCollectionBtn"),
        MergeBtn: document.getElementById("CombineCollectionBtn"),

        InputTitle: document.getElementById("CollectionInputTitle"),
        InputList: document.getElementById("CollectionListContainer"),
        AddFromClipboardBtn: document.getElementById("PasteCollectionBtn"),
        AddFromFileBtn: document.getElementById("FileCollectionBtn"),
        FileSelector: document.getElementById("FileInput"),
        ProceedBtn: document.getElementById("ContinueWithCollectionsBtn"),

        EditingArea: document.getElementById("SortableContainer"),
        RevertBtn: document.getElementById("UndoBtn"),
        FinishEditingBtn: document.getElementById("ProceedToExportBtn"),

        ResultDisplay: document.getElementById("ExportPreview"),
        ShowJsonBtn: document.getElementById("ViewJsonBtn"),
        ShowBase64Btn: document.getElementById("ViewBase64Btn"),
        CopyJsonBtn: document.getElementById("CopyJsonBtn"),
        CopyBase64Btn: document.getElementById("CopyBase64Btn"),
        SaveJsonBtn: document.getElementById("FinalExportJsonBtn"),
        SaveBase64Btn: document.getElementById("FinalExportBase64Btn"),
        ReturnToEditBtn: document.getElementById("BackToLayoutBtn"),

        ReturnHomeButtons: document.querySelectorAll(".BackToStartBtn")
    }

    function StartApplication() {
        AttachEventListeners()
        ShowStartScreen()
    }

    function SetButtonState(Button, IsActive) {
        Button.disabled = IsActive
        Button.classList.toggle("opacity-50", IsActive)
        Button.classList.toggle("cursor-not-allowed", IsActive)
    }

    function AttachEventListeners() {
        Interface.StartWithTokenBtn.addEventListener("click", DisplayAuthScreen)
        Interface.StartLocalBtn.addEventListener("click", function () {
            AppData.OperationMode = "local"
            AppData.CollectedData = []
            DisplayDataInputScreen("LOCAL EDITING MODE")
        })

        Interface.ReturnHomeButtons.forEach(function (Button) {
            Button.addEventListener("click", ShowStartScreen)
        })

        Interface.SubmitTokenBtn.addEventListener("click", async function () {
            if (AppData.ActiveOperations.has("SubmitToken")) return
            AppData.ActiveOperations.add("SubmitToken")
            SetButtonState(Interface.SubmitTokenBtn, true)

            try {
                const ClipboardText = await navigator.clipboard.readText()
                await ValidateAuthToken(ClipboardText)
            } catch (ErrorInfo) {
                DisplayNotification("Unable to read clipboard data", "error")
            } finally {
                AppData.ActiveOperations.delete("SubmitToken")
                SetButtonState(Interface.SubmitTokenBtn, false)
            }
        })

        Interface.FetchCurrentBtn.addEventListener("click", async function () {
            if (AppData.ActiveOperations.has("FetchCurrent")) return
            AppData.ActiveOperations.add("FetchCurrent")
            SetButtonState(Interface.FetchCurrentBtn, true)

            try {
                await RetrieveCurrentGifData()
            } finally {
                AppData.ActiveOperations.delete("FetchCurrent")
                SetButtonState(Interface.FetchCurrentBtn, false)
            }
        })

        Interface.EraseAllBtn.addEventListener("click", async function () {
            if (AppData.ActiveOperations.has("ClearAll")) return
            AppData.ActiveOperations.add("ClearAll")
            SetButtonState(Interface.EraseAllBtn, true)

            try {
                await ClearAllGifs()
            } finally {
                AppData.ActiveOperations.delete("ClearAll")
                SetButtonState(Interface.EraseAllBtn, false)
            }
        })

        Interface.OverwriteBtn.addEventListener("click", function () {
            AppData.OperationMode = "overwrite"
            AppData.CollectedData = []
            DisplayDataInputScreen("REPLACE CURRENT COLLECTION")
        })

        Interface.MergeBtn.addEventListener("click", async function () {
            if (AppData.ActiveOperations.has("Merge")) return
            AppData.ActiveOperations.add("Merge")
            SetButtonState(Interface.MergeBtn, true)

            try {
                const Response = await fetch("https://discord.com/api/v9/users/@me/settings-proto/2", {
                    headers: { Authorization: AppData.AuthenticationToken }
                })
                const ResponseData = await Response.json()
                const ExistingData = window.Processor.Base64ToJson(ResponseData.settings)
                AppData.CollectedData = [{
                    ...ExistingData,
                    IsLocked: true
                }]
                DisplayDataInputScreen("COMBINE WITH EXISTING")
            } catch (ErrorInfo) {
                DisplayNotification("Failed to retrieve existing data: " + ErrorInfo.message, "error")
            } finally {
                AppData.ActiveOperations.delete("Merge")
                SetButtonState(Interface.MergeBtn, false)
            }
        })

        Interface.AddFromClipboardBtn.addEventListener("click", async function () {
            if (AppData.ActiveOperations.has("PasteCollection")) return
            AppData.ActiveOperations.add("PasteCollection")
            SetButtonState(Interface.AddFromClipboardBtn, true)

            try {
                const ClipboardContent = await navigator.clipboard.readText()
                const ParsedData = ParseInputData(ClipboardContent)
                if (ParsedData) AddToCollectedData(ParsedData)
            } catch {
                DisplayNotification("Invalid clipboard content", "error")
            } finally {
                AppData.ActiveOperations.delete("PasteCollection")
                SetButtonState(Interface.AddFromClipboardBtn, false)
            }
        })

        Interface.AddFromFileBtn.addEventListener("click", function () {
            Interface.FileSelector.click()
        })

        Interface.FileSelector.addEventListener("change", function (Event) {
            HandleFileSelection(Event)
        })

        Interface.ProceedBtn.addEventListener("click", function () {
            if (AppData.CollectedData.length === 0) {
                DisplayNotification("Please add at least one collection", "error")
                return
            }

            if (AppData.OperationMode === "overwrite" || AppData.OperationMode === "local") {
                ProcessOverwriteOperation()
            } else if (AppData.OperationMode === "merge") {
                ProcessMergeOperation()
            }
        })

        Interface.RevertBtn.addEventListener("click", UndoLastAction)
        Interface.FinishEditingBtn.addEventListener("click", DisplayOutputScreen)

        Interface.ShowJsonBtn.addEventListener("click", ShowJsonPreview)
        Interface.ShowBase64Btn.addEventListener("click", ShowBase64Preview)
        Interface.CopyJsonBtn.addEventListener("click", CopyJsonToClipboard)
        Interface.CopyBase64Btn.addEventListener("click", CopyBase64ToClipboard)
        Interface.SaveJsonBtn.addEventListener("click", DownloadJsonFile)
        Interface.SaveBase64Btn.addEventListener("click", DownloadBase64File)
        Interface.ReturnToEditBtn.addEventListener("click", DisplayEditorScreen)
    }

    function ParseInputData(InputText) {
        try {
            return InputText.startsWith("{") ? JSON.parse(InputText) : window.Processor.Base64ToJson(InputText)
        } catch {
            return null
        }
    }

    function ShowStartScreen() {
        HideAllScreens()
        Interface.StartScreen.classList.remove("hidden")
        ResetApplicationData()
    }

    function DisplayAuthScreen() {
        HideAllScreens()
        Interface.AuthScreen.classList.remove("hidden")
    }

    function DisplayMainActionsScreen() {
        HideAllScreens()
        Interface.MainActionsScreen.classList.remove("hidden")
    }

    function DisplayDataInputScreen(TitleText) {
        HideAllScreens()
        Interface.DataInputScreen.classList.remove("hidden")
        Interface.InputTitle.textContent = TitleText
        if (AppData.CollectionSortHandler) {
            AppData.CollectionSortHandler.destroy()
            AppData.CollectionSortHandler = undefined
        }
        RenderCollectionList()
    }

    function DisplayEditorScreen() {
        HideAllScreens()
        Interface.EditorScreen.classList.remove("hidden")
        RenderGifEditingGrid()
    }

    function DisplayOutputScreen() {
        HideAllScreens()
        Interface.OutputScreen.classList.remove("hidden")
        ShowJsonPreview()

        if (AppData.AuthenticationToken) {
            if (!Interface.UpdateDiscordCollectionBtn) {
                Interface.UpdateDiscordCollectionBtn = document.createElement("button")
                Interface.UpdateDiscordCollectionBtn.className = "discord-auto-update-btn w-full h-12 rounded-default bg-gray-2 hover:bg-gray-3 font-bold text-lg hidden"
                Interface.UpdateDiscordCollectionBtn.textContent = "UPDATE DISCORD COLLECTION"
                Interface.UpdateDiscordCollectionBtn.addEventListener("click", function () {
                    if (AppData.ActiveOperations.has("AutoUpdate")) return
                    AppData.ActiveOperations.add("AutoUpdate")
                    SetButtonState(Interface.UpdateDiscordCollectionBtn, true)

                    UpdateDiscordCollection().finally(function () {
                        AppData.ActiveOperations.delete("AutoUpdate")
                        SetButtonState(Interface.UpdateDiscordCollectionBtn, false)
                    })
                })

                const ButtonContainer = Interface.OutputScreen.querySelector(".flex.flex-col")
                if (ButtonContainer) {
                    const BackBtn = ButtonContainer.querySelector("#BackToLayoutBtn")
                    if (BackBtn) {
                        ButtonContainer.insertBefore(Interface.UpdateDiscordCollectionBtn, BackBtn)
                    } else {
                        ButtonContainer.appendChild(Interface.UpdateDiscordCollectionBtn)
                    }
                }
            }

            Interface.UpdateDiscordCollectionBtn.classList.remove("hidden")
        } else {
            if (Interface.UpdateDiscordCollectionBtn) {
                Interface.UpdateDiscordCollectionBtn.classList.add("hidden")
            }
        }
    }

    function HideAllScreens() {
        document.querySelectorAll("section").forEach(function (Screen) {
            Screen.classList.add("hidden")
        })
    }

    function ResetApplicationData() {
        if (AppData.CollectionSortHandler) {
            AppData.CollectionSortHandler.destroy()
        }
        AppData.AuthenticationToken = ""
        AppData.GifItemList = []
        AppData.CollectedData = []
        AppData.PreviousActions = []
        AppData.OperationMode = ""
        AppData.SortingHandler = undefined
        AppData.CollectionSortHandler = undefined
    }

    function RenderCollectionList() {
        Interface.InputList.innerHTML = ""
        if (AppData.CollectedData.length === 0) {
            const Message = AppData.OperationMode === "merge"
                ? "Add collections to combine with your current one"
                : "No collections added yet"
            Interface.InputList.innerHTML = `
                <div class="bg-gray-2 rounded-default p-4 flex items-center justify-center h-40">
                    <p class="text-text-muted">${Message}</p>
                </div>
            `
            return
        }

        const ListContainer = document.createElement("div")
        ListContainer.id = "CollectionSortContainer"
        Interface.InputList.appendChild(ListContainer)

        AppData.CollectedData.forEach(function (Collection, Index) {
            const GifCount = Collection.gifs?.favorites?.length || 0
            const IsProtected = Collection.IsLocked || false
            const ListItem = document.createElement("div")
            ListItem.className = `bg-gray-2 rounded-default p-4 mb-4 collection-item ${IsProtected ? "locked border-l-4 border-blue-500" : ""}`
            ListItem.dataset.index = Index
            ListItem.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-bold">${IsProtected ? "YOUR CURRENT COLLECTION" : `Collection ${Index}`}</h3>
                        <p class="text-sm text-text-muted">${GifCount} GIFs</p>
                    </div>
                    ${IsProtected ? "" : `
                    <button class="remove-collection-btn w-8 h-8 rounded bg-gray-3 hover:bg-gray-4 flex items-center justify-center">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    `}
                </div>
            `

            if (!IsProtected) {
                ListItem.querySelector(".remove-collection-btn").addEventListener("click", function (Event) {
                    Event.stopPropagation()
                    AppData.CollectedData.splice(Index, 1)
                    RenderCollectionList()
                })
            }

            ListContainer.appendChild(ListItem)
        })

        if (AppData.CollectionSortHandler) {
            AppData.CollectionSortHandler.destroy()
        }

        AppData.CollectionSortHandler = new Sortable(ListContainer, {
            animation: 150,
            ghostClass: "sortable-ghost",
            draggable: ".collection-item",
            onEnd: function (Event) {
                if (Event.oldIndex !== Event.newIndex) {
                    const Items = Array.from(ListContainer.children)
                    const ReorderedCollections = Items.map(function (Item) {
                        return AppData.CollectedData[parseInt(Item.dataset.index)]
                    })
                    AppData.CollectedData = ReorderedCollections
                    Items.forEach(function (Item, Index) {
                        Item.dataset.index = Index
                    })
                }
            }
        })
    }

    function AddToCollectedData(CollectionData) {
        if (CollectionData?.gifs?.favorites?.length > 0) {
            if (CollectionData.IsLocked) return
            const SortedGifList = [...CollectionData.gifs.favorites].sort(function (A, B) {
                return (A.metadata?.e || 0) - (B.metadata?.e || 0)
            })
            SortedGifList.forEach(function (Gif, Index) {
                if (!Gif.metadata) Gif.metadata = {}
                Gif.metadata.e = Index + 1
            })

            AppData.CollectedData.push({
                metadata: { versionQ: 1, timesFavoritedQ: SortedGifList.length },
                gifs: { favorites: SortedGifList, xQ: 0 },
            })
            RenderCollectionList()
        } else {
            DisplayNotification("No GIFs found in collection", "error")
        }
    }

    async function ValidateAuthToken(Token) {
        try {
            const Response = await fetch("https://discord.com/api/v9/users/@me", {
                headers: { Authorization: Token }
            })
            if (!Response.ok) throw new Error("Invalid token")
            AppData.AuthenticationToken = Token
            DisplayMainActionsScreen()
            DisplayNotification("Token verified successfully!", "success")
        } catch (ErrorInfo) {
            DisplayNotification("Invalid token: " + ErrorInfo.message, "error")
        }
    }

    async function RetrieveCurrentGifData() {
        try {
            const Response = await fetch("https://discord.com/api/v9/users/@me/settings-proto/2", {
                headers: { Authorization: AppData.AuthenticationToken }
            })
            const ResponseData = await Response.json()
            const GifData = window.Processor.Base64ToJson(ResponseData.settings)
            ProcessGifData(GifData)
        } catch (ErrorInfo) {
            DisplayNotification("Failed to get collection: " + ErrorInfo.message, "error")
        }
    }

    async function ClearAllGifs() {
        try {
            const EmptyGifData = {
                metadata: { versionQ: 1, timesFavoritedQ: 0 },
                gifs: { favorites: [], xQ: 0 },
                emoji: { x: [] },
                xQ: { x: [] }
            }
            const EncodedData = window.Processor.JsonToBase64(EmptyGifData)
            const Base64Result = typeof EncodedData === "string" && EncodedData.includes(",")
                ? ConvertBytesToBase64(EncodedData)
                : EncodedData

            await SendToDiscord(Base64Result)
            DisplayNotification("Collection cleared successfully!", "success")
        } catch (ErrorInfo) {
            DisplayNotification("Failed to clear collection: " + ErrorInfo.message, "error")
        }
    }

    function ProcessOverwriteOperation() {
        try {
            if (AppData.CollectedData.length === 0) {
                throw new Error("Please add at least one collection")
            }

            let CombinedGifList = []
            let PositionCounter = 1

            const ReversedCollections = [...AppData.CollectedData].reverse()
            ReversedCollections.forEach(function (Collection) {
                const OrderedGifs = [...Collection.gifs.favorites].sort(function (A, B) {
                    return (A.metadata?.e || 0) - (B.metadata?.e || 0)
                })

                OrderedGifs.forEach(function (Gif) {
                    if (!Gif.metadata) Gif.metadata = {}
                    Gif.metadata.e = PositionCounter++
                    CombinedGifList.push(Gif)
                })
            })

            const FinalData = {
                metadata: { versionQ: 1, timesFavoritedQ: CombinedGifList.length },
                gifs: { favorites: CombinedGifList, xQ: 0 },
            }

            AppData.GifItemList = [...CombinedGifList]
            DisplayEditorScreen()
        } catch (ErrorInfo) {
            DisplayNotification("Failed to process collections: " + ErrorInfo.message, "error")
        }
    }

    function ProcessMergeOperation() {
        try {
            if (AppData.CollectedData.length < 2) {
                throw new Error("Please add at least one additional collection")
            }

            let MergedGifList = []
            let PositionCounter = 1

            const ReversedCollections = [...AppData.CollectedData].reverse()
            ReversedCollections.forEach(function (Collection) {
                const OrderedGifs = [...Collection.gifs.favorites].sort(function (A, B) {
                    return (A.metadata?.e || 0) - (B.metadata?.e || 0)
                })

                OrderedGifs.forEach(function (Gif) {
                    if (!Gif.metadata) Gif.metadata = {}
                    Gif.metadata.e = PositionCounter++
                    MergedGifList.push(Gif)
                })
            })

            AppData.GifItemList = [...MergedGifList]
            DisplayEditorScreen()
        } catch (ErrorInfo) {
            DisplayNotification("Failed to merge collections: " + ErrorInfo.message, "error")
        }
    }

    async function UpdateDiscordCollection() {
        try {
            const ExportData = GenerateExportData()
            const EncodedData = window.Processor.JsonToBase64(ExportData)
            const Base64Result = typeof EncodedData === "string" && EncodedData.includes(",")
                ? ConvertBytesToBase64(EncodedData)
                : EncodedData

            await SendToDiscord(Base64Result)
            DisplayNotification("Discord collection updated successfully!", "success")
        } catch (ErrorInfo) {
            DisplayNotification("Failed to update Discord collection: " + ErrorInfo.message, "error")
        }
    }

    async function SendToDiscord(EncodedData) {
        const Response = await fetch("https://discord.com/api/v9/users/@me/settings-proto/2", {
            method: "PATCH",
            headers: {
                "Authorization": AppData.AuthenticationToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ settings: EncodedData })
        })

        if (!Response.ok) throw new Error("Failed to update collection")
    }

    function HandleFileSelection(Event) {
        const SelectedFile = Event.target.files[0]
        if (!SelectedFile) return
        const FileReader = new FileReader()
        FileReader.onload = function (Event) {
            try {
                const FileContent = Event.target.result
                const ParsedData = ParseInputData(FileContent)
                if (ParsedData) {
                    if (Interface.DataInputScreen.classList.contains("hidden")) {
                        ProcessGifData(ParsedData)
                    } else {
                        AddToCollectedData(ParsedData)
                    }
                }
            } catch {
                DisplayNotification("Invalid file content", "error")
            }
        }
        if (SelectedFile.name.endsWith(".json")) {
            FileReader.readAsText(SelectedFile)
        } else {
            FileReader.readAsDataURL(SelectedFile)
        }
    }

    function ProcessGifData(GifData) {
        if (GifData.gifs?.favorites?.length > 0) {
            AppData.GifItemList = GifData.gifs.favorites
            AppData.PreviousActions = []
            AppData.SortingHandler = undefined
            DisplayEditorScreen()
        } else {
            DisplayNotification("No GIFs found in data", "error")
        }
    }

    function RenderGifEditingGrid() {
        const GridContainer = document.createElement("div")
        GridContainer.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full"
        GridContainer.id = "GifEditGrid"
        Interface.EditingArea.innerHTML = ""
        Interface.EditingArea.appendChild(GridContainer)

        const SortedByPosition = [...AppData.GifItemList].sort(function (A, B) {
            return (B.metadata?.e || 0) - (A.metadata?.e || 0)
        })
        const UpdatedGifList = SortedByPosition.map(function (Gif, Index) {
            return {
                url: Gif.url,
                metadata: {
                    format: Gif.metadata.format,
                    src: Gif.metadata.src,
                    width: Gif.metadata.width,
                    height: Gif.metadata.height,
                    e: SortedByPosition.length - Index
                }
            }
        })
        AppData.GifItemList = UpdatedGifList

        const DocumentFragment = document.createDocumentFragment()
        UpdatedGifList.forEach(function (Gif, DisplayIndex) {
            const ImageUrl = Gif.metadata?.src || Gif.url
            const GifItem = document.createElement("div")
            GifItem.className = "relative bg-gray-2 rounded-default h-64 w-full overflow-hidden"
            GifItem.dataset.index = DisplayIndex

            const ImageContainer = document.createElement("div")
            ImageContainer.className = "bg-transparent relative w-full h-full"

            const Image = document.createElement("img")
            Image.className = "absolute inset-0 w-full h-full object-contain"
            Image.loading = "lazy"
            Image.decoding = "async"
            Image.src = ImageUrl

            const PositionDisplay = document.createElement("div")
            PositionDisplay.className = "absolute top-2 left-2 flex items-center"

            const PositionLabel = document.createElement("span")
            PositionLabel.className = "text-sm font-bold text-white px-2 py-1 rounded-l bg-black bg-opacity-70"
            PositionLabel.textContent = "Pos"

            const PositionNumber = document.createElement("span")
            PositionNumber.className = "position-value text-sm font-bold text-white px-2 py-1 rounded-r bg-black bg-opacity-70 cursor-pointer"
            PositionNumber.textContent = Gif.metadata?.e || "N/A"

            const DeleteButton = document.createElement("button")
            DeleteButton.className = "remove-btn absolute right-2 top-2 w-7 h-7 rounded bg-black flex items-center justify-center text-white cursor-pointer"
            DeleteButton.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`
            DeleteButton.addEventListener("click", function (Event) {
                Event.stopPropagation()
                RemoveGifItem(DisplayIndex)
            })

            PositionNumber.addEventListener("click", function () {
                const InputField = document.createElement("input")
                InputField.type = "text"
                InputField.className = "text-sm font-bold text-white bg-black bg-opacity-90 px-2 py-1 rounded w-16 outline-none"
                InputField.value = Gif.metadata?.e || ""

                PositionDisplay.replaceChild(InputField, PositionNumber)
                InputField.focus()
                InputField.select()

                const HandleInputComplete = function () {
                    const NewPosition = parseInt(InputField.value)
                    const CurrentPosition = Gif.metadata?.e || 1
                    const MaxPosition = AppData.GifItemList.length

                    if (!isNaN(NewPosition) && NewPosition >= 1 && NewPosition <= MaxPosition && NewPosition !== CurrentPosition) {
                        UpdateGifPosition(DisplayIndex, NewPosition)
                    }

                    PositionDisplay.replaceChild(PositionNumber, InputField)
                    InputField.removeEventListener("blur", HandleInputComplete)
                    InputField.removeEventListener("keydown", HandleInputKeyPress)
                }

                const HandleInputKeyPress = function (Event) {
                    if (Event.key === "Enter") HandleInputComplete()
                }

                InputField.addEventListener("blur", HandleInputComplete)
                InputField.addEventListener("keydown", HandleInputKeyPress)
            })

            PositionDisplay.appendChild(PositionLabel)
            PositionDisplay.appendChild(PositionNumber)
            ImageContainer.appendChild(Image)
            GifItem.appendChild(ImageContainer)
            GifItem.appendChild(PositionDisplay)
            GifItem.appendChild(DeleteButton)
            DocumentFragment.appendChild(GifItem)
        })

        GridContainer.appendChild(DocumentFragment)

        if (AppData.SortingHandler) {
            AppData.SortingHandler.destroy()
        }

        AppData.SortingHandler = new Sortable(GridContainer, {
            animation: 150,
            ghostClass: "sortable-ghost",
            onEnd: function () {
                UpdateGridOrder()
            }
        })

        RefreshUndoButton()
    }

    function UpdateGifPosition(CurrentIndex, NewPosition) {
        const PreviousState = JSON.parse(JSON.stringify(AppData.GifItemList))
        const ModifiedGifs = [...AppData.GifItemList]
        const TotalItems = ModifiedGifs.length
        NewPosition = Math.max(1, Math.min(NewPosition, TotalItems))

        const TargetGif = ModifiedGifs[CurrentIndex]
        if (!TargetGif) return

        if (!TargetGif.metadata) TargetGif.metadata = {}

        const OldPosition = TargetGif.metadata.e || (TotalItems - CurrentIndex)
        if (OldPosition === NewPosition) return

        ModifiedGifs.forEach(function (Gif) {
            if (!Gif.metadata) Gif.metadata = {}

            if (OldPosition < NewPosition) {
                if (Gif.metadata.e > OldPosition && Gif.metadata.e <= NewPosition) {
                    Gif.metadata.e -= 1
                }
            } else {
                if (Gif.metadata.e < OldPosition && Gif.metadata.e >= NewPosition) {
                    Gif.metadata.e += 1
                }
            }
        })

        TargetGif.metadata.e = NewPosition
        AppData.GifItemList = ModifiedGifs.sort(function (A, B) {
            return (A.metadata.e || 0) - (B.metadata.e || 0)
        })

        AppData.PreviousActions.push({
            ActionType: "position_change",
            PreviousState: PreviousState,
        })

        RenderGifEditingGrid()
        RefreshUndoButton()
    }

    function RemoveGifItem(Index) {
        AppData.PreviousActions.push({
            ActionType: "remove_item",
            PreviousState: [...AppData.GifItemList]
        })
        AppData.GifItemList.splice(Index, 1)
        RenderGifEditingGrid()
    }

    function UndoLastAction() {
        if (AppData.PreviousActions.length === 0) return

        const LastAction = AppData.PreviousActions.pop()
        AppData.GifItemList = JSON.parse(JSON.stringify(LastAction.PreviousState))

        RenderGifEditingGrid()
        RefreshUndoButton()
    }

    function RefreshUndoButton() {
        const HasHistory = AppData.PreviousActions.length > 0
        Interface.RevertBtn.classList.toggle("hidden", !HasHistory)
    }

    function UpdateGridOrder() {
        const GridContainer = document.getElementById("GifEditGrid")
        if (!GridContainer) return

        const PreviousState = [...AppData.GifItemList]

        const GridItems = Array.from(GridContainer.children)
        AppData.GifItemList = GridItems.map(function (Item, NewIndex) {
            const OriginalIndex = parseInt(Item.dataset.index)
            const OriginalGif = AppData.GifItemList[OriginalIndex]

            return {
                url: OriginalGif.url,
                metadata: {
                    format: OriginalGif.metadata.format,
                    src: OriginalGif.metadata.src,
                    width: OriginalGif.metadata.width,
                    height: OriginalGif.metadata.height,
                    e: GridItems.length - NewIndex
                }
            }
        })

        AppData.PreviousActions.push({
            ActionType: "reorder_grid",
            PreviousState: PreviousState
        })

        RenderGifEditingGrid()
    }

    function CreateUniqueIdentifier(Data) {
        try {
            let DataString
            if (typeof Data === "object" && Data !== null) {
                DataString = JSON.stringify(Data)
            } else if (typeof Data === "string") {
                try {
                    const ParsedContent = JSON.parse(Data)
                    DataString = JSON.stringify(ParsedContent)
                } catch (Error) {
                    DataString = Data
                }
            } else {
                DataString = String(Data)
            }

            const RandomBytes = new Uint8Array(32)
            if (typeof crypto !== "undefined" && crypto.getRandomValues) {
                crypto.getRandomValues(RandomBytes)
            } else {
                for (let i = 0; i < 32; i++) RandomBytes[i] = Math.floor(Math.random() * 256)
            }

            const Base64Hash = btoa(String.fromCharCode(...RandomBytes))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "")
                .substring(0, 30)
            return Base64Hash
        } catch (Error) {
            const FallbackIdentifier = typeof Data === "string" ? Data.slice(0, 30) : "fallback"
            return FallbackIdentifier.replace(/[+/=]/g, "_")
        }
    }

    function ShowJsonPreview() {
        const ExportData = GenerateExportData()
        const FormattedJson = ApplyJsonSyntaxHighlighting(JSON.stringify(ExportData, null, 2))
        Interface.ResultDisplay.innerHTML = FormattedJson
    }

    function ShowBase64Preview() {
        try {
            const ExportData = GenerateExportData()
            const EncodedData = window.Processor.JsonToBase64(ExportData)
            const Base64Result = typeof EncodedData === "string" && EncodedData.includes(",")
                ? ConvertBytesToBase64(EncodedData)
                : EncodedData
            Interface.ResultDisplay.textContent = Base64Result
        } catch (Error) {
            Interface.ResultDisplay.textContent = `Error: ${Error.message}`
        }
    }

    function CopyJsonToClipboard() {
        const ExportData = GenerateExportData()
        navigator.clipboard.writeText(JSON.stringify(ExportData, null, 2))
            .then(function () {
                DisplayNotification("JSON copied to clipboard", "success")
            })
            .catch(function () {
                DisplayNotification("Failed to copy JSON", "error")
            })
    }

    function CopyBase64ToClipboard() {
        try {
            const ExportData = GenerateExportData()
            const EncodedData = window.Processor.JsonToBase64(ExportData)
            const Base64Result = typeof EncodedData === "string" && EncodedData.includes(",")
                ? ConvertBytesToBase64(EncodedData)
                : EncodedData
            navigator.clipboard.writeText(Base64Result)
                .then(function () {
                    DisplayNotification("Base64 copied to clipboard", "success")
                })
                .catch(function () {
                    DisplayNotification("Failed to copy Base64", "error")
                })
        } catch (Error) {
            DisplayNotification("Failed to generate Base64", "error")
        }
    }

    function GenerateExportData() {
        const OrderedGifs = [...AppData.GifItemList].sort(function (A, B) {
            return (A.metadata?.e || 0) - (B.metadata?.e || 0)
        })

        return {
            metadata: { versionQ: 1, timesFavoritedQ: OrderedGifs.length },
            gifs: { favorites: OrderedGifs, xQ: 0 }
        }
    }

    function DownloadJsonFile() {
        const ExportData = GenerateExportData()
        const UniqueId = CreateUniqueIdentifier(ExportData)
        const FileContent = new Blob([JSON.stringify(ExportData, null, 2)], { type: "application/json" })
        const FileUrl = URL.createObjectURL(FileContent)
        const DownloadLink = document.createElement("a")
        DownloadLink.href = FileUrl
        DownloadLink.download = "gif_collection_" + UniqueId + ".json"
        DownloadLink.click()
        URL.revokeObjectURL(FileUrl)
    }

    function DownloadBase64File() {
        try {
            const ExportData = GenerateExportData()
            const EncodedData = window.Processor.JsonToBase64(ExportData)
            const Base64Result = typeof EncodedData === "string" && EncodedData.includes(",")
                ? ConvertBytesToBase64(EncodedData)
                : EncodedData

            const UniqueId = CreateUniqueIdentifier(Base64Result)
            const FileContent = new Blob([Base64Result], { type: "application/octet-stream" })
            const FileUrl = URL.createObjectURL(FileContent)
            const DownloadLink = document.createElement("a")
            DownloadLink.href = FileUrl
            DownloadLink.download = "gif_collection_" + UniqueId + ".bin"
            DownloadLink.click()
            URL.revokeObjectURL(FileUrl)
        } catch (Error) {
            DisplayNotification("Export failed: " + Error.message, "error")
        }
    }

    function ConvertBytesToBase64(ByteString) {
        const ByteArray = ByteString.replace(/\s/g, "").split(",").map(Number)
        const ByteBuffer = new Uint8Array(ByteArray)
        let BinaryString = ""
        ByteBuffer.forEach(function (Byte) {
            BinaryString += String.fromCharCode(Byte)
        })
        return btoa(BinaryString)
    }

    function ApplyJsonSyntaxHighlighting(JsonText) {
        JsonText = JsonText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        return JsonText.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (Match) {
                let StyleClass = "text-gray-4"
                if (/^"/.test(Match)) {
                    if (/:$/.test(Match)) {
                        StyleClass = "text-purple-400"
                    } else {
                        StyleClass = "text-green-400"
                    }
                } else if (/true|false/.test(Match)) {
                    StyleClass = "text-blue-400"
                } else if (/null/.test(Match)) {
                    StyleClass = "text-red-400"
                } else if (!isNaN(parseFloat(Match))) {
                    StyleClass = "text-yellow-400"
                }
                return '<span class="' + StyleClass + '">' + Match + '</span>'
            })
    }

    function DisplayNotification(Message, Type) {
        const StatusColors = {
            success: "#4BB543",
            error: "#FF3333",
            info: "#3498db",
            warning: "#FFA500"
        }

        Toastify({
            text: Message,
            duration: 3000,
            gravity: "bottom",
            position: "left",
            style: { "background": StatusColors[Type] || StatusColors.info, "box-shadow": "none" },
            className: "rounded-default",
            stopOnFocus: true
        }).showToast()
    }

    StartApplication()
})
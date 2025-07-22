class GifCurator {
    constructor() {
        this.Elements = {
            LoginSection: document.getElementById("LoginSection"),
            TokenLoginBtn: document.getElementById("TokenLoginBtn"),
            LocalEditBtn: document.getElementById("LocalEditBtn"),

            TokenSection: document.getElementById("TokenSection"),
            BackToLoginBtn: document.getElementById("BackToLoginBtn"),
            PasteTokenBtn: document.getElementById("PasteTokenBtn"),
            TokenStatusMessage: document.getElementById("TokenStatusMessage"),

            DiscordActionsSection: document.getElementById("DiscordActionsSection"),
            BackToTokenBtn: document.getElementById("BackToTokenBtn"),
            GetCurrentCollectionBtn: document.getElementById("GetCurrentCollectionBtn"),
            ClearCollectionBtn: document.getElementById("ClearCollectionBtn"),
            ReplaceCollectionBtn: document.getElementById("ReplaceCollectionBtn"),
            CombineCollectionBtn: document.getElementById("CombineCollectionBtn"),

            CollectionInputSection: document.getElementById("CollectionInputSection"),
            CollectionInputTitle: document.getElementById("CollectionInputTitle"),
            CollectionListContainer: document.getElementById("CollectionListContainer"),
            PasteCollectionBtn: document.getElementById("PasteCollectionBtn"),
            FileCollectionBtn: document.getElementById("FileCollectionBtn"),
            FileInput: document.getElementById("FileInput"),
            ContinueWithCollectionsBtn: document.getElementById("ContinueWithCollectionsBtn"),

            LayoutSection: document.getElementById("LayoutSection"),
            SortableContainer: document.getElementById("SortableContainer"),
            UndoBtn: document.getElementById("UndoBtn"),
            ProceedToExportBtn: document.getElementById("ProceedToExportBtn"),

            ExportSection: document.getElementById("ExportSection"),
            ExportPreview: document.getElementById("ExportPreview"),
            ViewJsonBtn: document.getElementById("ViewJsonBtn"),
            ViewBase64Btn: document.getElementById("ViewBase64Btn"),
            CopyJsonBtn: document.getElementById("CopyJsonBtn"),
            CopyBase64Btn: document.getElementById("CopyBase64Btn"),
            FinalExportJsonBtn: document.getElementById("FinalExportJsonBtn"),
            FinalExportBase64Btn: document.getElementById("FinalExportBase64Btn"),
            BackToLayoutBtn: document.getElementById("BackToLayoutBtn"),
            ReplaceDiscordBtn: document.createElement("button"),

            BackToStartBtn: document.querySelectorAll(".BackToStartBtn"),
            GithubLink: document.querySelector("a[href*='github']")
        }

        this.State = {
            OriginalData: null,
            FilteredGifs: [],
            ActionHistory: [],
            SortableInstance: null,
            CollectionSortableInstance: null,
            RemovedGifs: [],
            DiscordToken: null,
            Collections: [],
            CurrentAction: null
        }

        this.Initialize()
    }

    Initialize() {
        this.ShowLoginSection()

        this.Elements.TokenLoginBtn.addEventListener("click", () => this.ShowTokenSection())
        this.Elements.LocalEditBtn.addEventListener("click", () => {
            this.State.CurrentAction = "replace"
            this.State.Collections = []
            this.ShowCollectionInputSection("LOCAL EDIT")
        })

        this.Elements.BackToStartBtn.forEach(Button => {
            Button.addEventListener("click", () => this.ShowLoginSection())
        })

        this.Elements.PasteTokenBtn.addEventListener("click", async () => {
            try {
                const Token = await navigator.clipboard.readText()
                await this.VerifyToken(Token)
            } catch (Error) {
                this.ShowStatusMessage("Failed to read clipboard", "error", "token")
            }
        })

        this.Elements.GetCurrentCollectionBtn.addEventListener("click", () => this.GetCurrentCollection())
        this.Elements.ClearCollectionBtn.addEventListener("click", () => this.ClearCollection())
        this.Elements.ReplaceCollectionBtn.addEventListener("click", () => {
            this.State.CurrentAction = "replace"
            this.State.Collections = []
            this.ShowCollectionInputSection("REPLACE COLLECTION")
        })
        this.Elements.CombineCollectionBtn.addEventListener("click", async () => {
            this.State.CurrentAction = "combine"
            try {
                const Response = await fetch("https://discord.com/api/v9/users/@me/settings-proto/2", {
                    headers: { Authorization: this.State.DiscordToken }
                })
                const Data = await Response.json()
                const CurrentCollection = window.Processor.Base64ToJson(Data.settings)
                this.State.Collections = [{
                    ...CurrentCollection,
                    Locked: true
                }]
                this.ShowCollectionInputSection("COMBINE COLLECTIONS")
            } catch (Error) {
                this.ShowStatusMessage("Failed to get current collection: " + Error.message, "error")
            }
        })

        this.Elements.PasteCollectionBtn.addEventListener("click", async () => {
            try {
                const Text = await navigator.clipboard.readText()
                const Collection = this.ParseCollectionInput(Text)
                if (Collection) this.AddCollection(Collection)
            } catch {
                this.ShowStatusMessage("Invalid data in clipboard", "error")
            }
        })

        this.Elements.FileCollectionBtn.addEventListener("click", () => this.Elements.FileInput.click())
        this.Elements.FileInput.addEventListener("change", (Event) => this.HandleFileUpload(Event))

        this.Elements.ContinueWithCollectionsBtn.addEventListener("click", () => {
            if (this.State.Collections.length === 0) {
                this.ShowStatusMessage("Please add at least one collection", "error")
                return
            }

            if (this.State.CurrentAction === "replace") this.ReplaceCollection()
            else if (this.State.CurrentAction === "combine") this.CombineCollections()
        })

        this.Elements.UndoBtn.addEventListener("click", () => this.HandleUndo())
        this.Elements.ProceedToExportBtn.addEventListener("click", () => this.ShowExportSection())

        this.Elements.ViewJsonBtn.addEventListener("click", () => this.ShowJsonView())
        this.Elements.ViewBase64Btn.addEventListener("click", () => this.ShowBase64View())
        this.Elements.CopyJsonBtn.addEventListener("click", () => this.CopyJson())
        this.Elements.CopyBase64Btn.addEventListener("click", () => this.CopyBase64())
        this.Elements.FinalExportJsonBtn.addEventListener("click", () => this.ExportJson())
        this.Elements.FinalExportBase64Btn.addEventListener("click", () => this.ExportBase64())
        this.Elements.BackToLayoutBtn.addEventListener("click", () => this.ShowLayoutSection())
    }

    ParseCollectionInput(Text) {
        try {
            return Text.startsWith("{") ? JSON.parse(Text) : window.Processor.Base64ToJson(Text)
        } catch {
            return null
        }
    }

    ShowLoginSection() {
        this.HideAllSections()
        this.Elements.LoginSection.classList.remove("hidden")
        this.ResetState()
    }

    ShowTokenSection() {
        this.HideAllSections()
        this.Elements.TokenSection.classList.remove("hidden")
    }

    ShowDiscordActionsSection() {
        this.HideAllSections()
        this.Elements.DiscordActionsSection.classList.remove("hidden")
    }

    ShowCollectionInputSection(Title) {
        this.HideAllSections()
        this.Elements.CollectionInputSection.classList.remove("hidden")
        this.Elements.CollectionInputTitle.textContent = Title
        if (this.State.CollectionSortableInstance) {
            this.State.CollectionSortableInstance.destroy()
            this.State.CollectionSortableInstance = null
        }
        this.RenderCollectionList()
    }

    ShowLayoutSection() {
        this.HideAllSections()
        this.Elements.LayoutSection.classList.remove("hidden")
        this.RenderGifGrid()
    }

    ShowExportSection() {
        this.HideAllSections()
        this.Elements.ExportSection.classList.remove("hidden")
        this.ShowJsonView()

        if (this.State.DiscordToken) {
            this.Elements.ReplaceDiscordBtn.className = "w-full h-12 rounded-default bg-gray-2 hover:bg-gray-3 font-bold text-lg"
            this.Elements.ReplaceDiscordBtn.textContent = "REPLACE DISCORD COLLECTION AUTOMATICALLY"
            this.Elements.ReplaceDiscordBtn.addEventListener("click", () => this.ReplaceDiscordCollection())

            const ExportButtonsContainer = this.Elements.ExportSection.querySelector(".flex.flex-col")
            if (ExportButtonsContainer) {
                const BackButton = ExportButtonsContainer.querySelector("#BackToLayoutBtn")
                if (BackButton) {
                    ExportButtonsContainer.insertBefore(this.Elements.ReplaceDiscordBtn, BackButton)
                } else {
                    ExportButtonsContainer.appendChild(this.Elements.ReplaceDiscordBtn)
                }
            }
        }
    }

    HideAllSections() {
        document.querySelectorAll("section").forEach(Section => {
            Section.classList.add("hidden")
        })
    }

    ResetState() {
        if (this.State.CollectionSortableInstance) {
            this.State.CollectionSortableInstance.destroy()
        }
        this.State = {
            OriginalData: null,
            FilteredGifs: [],
            ActionHistory: [],
            SortableInstance: null,
            CollectionSortableInstance: null,
            RemovedGifs: [],
            DiscordToken: null,
            Collections: [],
            CurrentAction: null
        }
    }

    RenderCollectionList() {
        this.Elements.CollectionListContainer.innerHTML = ""
        if (this.State.Collections.length === 0) {
            const Message = this.State.CurrentAction === "combine"
                ? "Add collections to combine with your current one"
                : "No collections added yet"
            this.Elements.CollectionListContainer.innerHTML = `
                <div class="bg-gray-2 rounded-default p-4 flex items-center justify-center h-40">
                    <p class="text-text-muted">${Message}</p>
                </div>
            `
            return
        }

        const SortableContainer = document.createElement("div")
        SortableContainer.id = "SortableCollectionsContainer"
        this.Elements.CollectionListContainer.appendChild(SortableContainer)

        this.State.Collections.forEach((Collection, Index) => {
            const GifCount = Collection.gifs?.favorites?.length || 0
            const IsLocked = Collection.Locked || false
            const Item = document.createElement("div")
            Item.className = `bg-gray-2 rounded-default p-4 mb-4 collection-item ${IsLocked ? "locked border-l-4 border-blue-500" : ""}`
            Item.dataset.index = Index
            Item.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-bold">${IsLocked ? "YOUR CURRENT COLLECTION" : `Collection ${Index}`}</h3>
                        <p class="text-sm text-text-muted">${GifCount} GIFs</p>
                    </div>
                    ${IsLocked ? "" : `
                    <button class="remove-collection-btn w-8 h-8 rounded bg-gray-3 hover:bg-gray-4 flex items-center justify-center">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    `}
                </div>
            `

            if (!IsLocked) {
                Item.querySelector(".remove-collection-btn").addEventListener("click", (E) => {
                    E.stopPropagation()
                    this.State.Collections.splice(Index, 1)
                    this.RenderCollectionList()
                })
            }

            SortableContainer.appendChild(Item)
        })

        if (this.State.CollectionSortableInstance) {
            this.State.CollectionSortableInstance.destroy()
        }

        this.State.CollectionSortableInstance = new Sortable(SortableContainer, {
            animation: 150,
            ghostClass: "sortable-ghost",
            draggable: ".collection-item",
            onEnd: (evt) => {
                if (evt.oldIndex !== evt.newIndex) {
                    const Items = Array.from(SortableContainer.children)
                    const NewCollections = Items.map(item =>
                        this.State.Collections[parseInt(item.dataset.index)]
                    )
                    this.State.Collections = NewCollections
                    Items.forEach((item, index) => {
                        item.dataset.index = index
                    })
                }
            }
        })
    }

    AddCollection(Collection) {
        if (Collection?.gifs?.favorites?.length > 0) {
            if (Collection.Locked) return
            const SortedGifs = [...Collection.gifs.favorites].sort((A, B) => (A.metadata?.e || 0) - (B.metadata?.e || 0))
            SortedGifs.forEach((Gif, Index) => {
                if (!Gif.metadata) Gif.metadata = {}
                Gif.metadata.e = Index + 1
            })

            if (this.State.CurrentAction === "combine" && this.State.Collections.length > 0 && this.State.Collections[0].Locked) {
                this.State.Collections.push({
                    metadata: { versionQ: 1, timesFavoritedQ: SortedGifs.length },
                    gifs: { favorites: SortedGifs, xQ: 0 },
                })
            } else {
                this.State.Collections.push({
                    metadata: { versionQ: 1, timesFavoritedQ: SortedGifs.length },
                    gifs: { favorites: SortedGifs, xQ: 0 },
                })
            }
            this.RenderCollectionList()
        } else {
            this.ShowStatusMessage("No GIFs found in collection", "error")
        }
    }

    async VerifyToken(Token) {
        try {
            const Response = await fetch("https://discord.com/api/v9/users/@me", {
                headers: { Authorization: Token }
            })
            if (!Response.ok) throw new Error("Invalid token")
            this.State.DiscordToken = Token
            this.ShowDiscordActionsSection()
            this.ShowStatusMessage("Token verified successfully!", "success", "token")
        } catch (Error) {
            this.ShowStatusMessage("Invalid token: " + Error.message, "error", "token")
        }
    }

    async GetCurrentCollection() {
        try {
            const Response = await fetch("https://discord.com/api/v9/users/@me/settings-proto/2", {
                headers: { Authorization: this.State.DiscordToken }
            })
            const Data = await Response.json()
            const Collection = window.Processor.Base64ToJson(Data.settings)
            this.ProcessJsonData(Collection)
        } catch (Error) {
            this.ShowStatusMessage("Failed to get collection: " + Error.message, "error")
        }
    }

    async ClearCollection() {
        try {
            const EmptyCollection = {
                metadata: { versionQ: 1, timesFavoritedQ: 0 },
                gifs: { favorites: [], xQ: 0 },
                emoji: { x: [] },
                xQ: { x: [] }
            }
            const BinaryData = window.Processor.JsonToBase64(EmptyCollection)
            const Base64String = typeof BinaryData === "string" && BinaryData.includes(",")
                ? this.ConvertByteStringToBase64(BinaryData)
                : BinaryData

            await this.UpdateDiscordCollection(Base64String)
            this.ShowStatusMessage("Collection cleared successfully!", "success")
        } catch (Error) {
            this.ShowStatusMessage("Failed to clear collection: " + Error.message, "error")
        }
    }

    async ReplaceCollection() {
        try {
            if (this.State.Collections.length === 0) {
                throw new Error("Please add at least one collection")
            }

            let CombinedGifs = []
            let CurrentPosition = 1

            const CollectionsCopy = [...this.State.Collections].reverse()
            CollectionsCopy.forEach(Collection => {
                const SortedGifs = [...Collection.gifs.favorites].sort(
                    (A, B) => (A.metadata?.e || 0) - (B.metadata?.e || 0)
                )

                SortedGifs.forEach(Gif => {
                    if (!Gif.metadata) Gif.metadata = {}
                    Gif.metadata.e = CurrentPosition++
                    CombinedGifs.push(Gif)
                })
            })

            const UpdatedCollection = {
                metadata: { versionQ: 1, timesFavoritedQ: CombinedGifs.length },
                gifs: { favorites: CombinedGifs, xQ: 0 },
            }

            this.State.OriginalData = UpdatedCollection
            this.State.FilteredGifs = [...CombinedGifs]
            this.ShowLayoutSection()
        } catch (Error) {
            this.ShowStatusMessage("Failed to replace collection: " + Error.message, "error")
        }
    }

    CombineCollections() {
        try {
            if (this.State.Collections.length < 2) {
                throw new Error("Please add at least one additional collection")
            }

            let CombinedGifs = []
            let CurrentPosition = 1

            const CollectionsCopy = [...this.State.Collections].reverse()
            CollectionsCopy.forEach(Collection => {
                const SortedGifs = [...Collection.gifs.favorites].sort(
                    (A, B) => (A.metadata?.e || 0) - (B.metadata?.e || 0)
                )

                SortedGifs.forEach(Gif => {
                    if (!Gif.metadata) Gif.metadata = {}
                    Gif.metadata.e = CurrentPosition++
                    CombinedGifs.push(Gif)
                })
            })

            const UpdatedCollection = {
                metadata: { versionQ: 1, timesFavoritedQ: CombinedGifs.length },
                gifs: { favorites: CombinedGifs, xQ: 0 },
            }

            this.State.OriginalData = UpdatedCollection
            this.State.FilteredGifs = [...CombinedGifs]
            this.ShowLayoutSection()
        } catch (Error) {
            this.ShowStatusMessage("Failed to combine collections: " + Error.message, "error")
        }
    }

    async ReplaceDiscordCollection() {
        try {
            const ExportData = this.GetExportData()
            const BinaryData = window.Processor.JsonToBase64(ExportData)
            const Base64String = typeof BinaryData === "string" && BinaryData.includes(",")
                ? this.ConvertByteStringToBase64(BinaryData)
                : BinaryData

            await this.UpdateDiscordCollection(Base64String)
            this.ShowStatusMessage("Discord collection updated successfully!", "success")
        } catch (Error) {
            this.ShowStatusMessage("Failed to update Discord collection: " + Error.message, "error")
        }
    }

    async UpdateDiscordCollection(Base64Data) {
        const Response = await fetch("https://discord.com/api/v9/users/@me/settings-proto/2", {
            method: "PATCH",
            headers: {
                "Authorization": this.State.DiscordToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ settings: Base64Data })
        })

        if (!Response.ok) throw new Error("Failed to update collection")
    }

    HandleFileUpload(Event) {
        const File = Event.target.files[0]
        if (!File) return
        const Reader = new FileReader()
        Reader.onload = (E) => {
            try {
                const Text = E.target.result
                const Collection = this.ParseCollectionInput(Text)
                if (Collection) {
                    if (this.Elements.CollectionInputSection.classList.contains("hidden")) {
                        this.ProcessJsonData(Collection)
                    } else {
                        this.AddCollection(Collection)
                    }
                }
            } catch {
                this.ShowStatusMessage("Invalid file content", "error")
            }
        }
        if (File.name.endsWith(".json")) Reader.readAsText(File)
        else Reader.readAsDataURL(File)
    }

    ProcessJsonData(JsonData) {
        if (JsonData.gifs?.favorites?.length > 0) {
            this.State.OriginalData = JsonData
            this.State.FilteredGifs = JsonData.gifs.favorites
            this.State.ActionHistory = []
            this.State.SortableInstance = null
            this.State.RemovedGifs = []
            this.ShowLayoutSection()
        } else {
            this.ShowStatusMessage("No GIFs found in data", "error")
        }
    }

    RenderGifGrid() {
        const GridContainer = document.createElement("div")
        GridContainer.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full"
        GridContainer.id = "GifGridContainer"
        this.Elements.SortableContainer.innerHTML = ""
        this.Elements.SortableContainer.appendChild(GridContainer)

        const SortedGifs = [...this.State.FilteredGifs].sort((A, B) => (B.metadata?.e || 0) - (A.metadata?.e || 0))
        const UpdatedGifs = SortedGifs.map((Gif, Index) => ({
            url: Gif.url,
            metadata: {
                format: Gif.metadata.format,
                src: Gif.metadata.src,
                width: Gif.metadata.width,
                height: Gif.metadata.height,
                e: SortedGifs.length - Index
            }
        }))
        this.State.FilteredGifs = UpdatedGifs

        const Fragment = document.createDocumentFragment()
        UpdatedGifs.forEach((Gif, DisplayIndex) => {
            const GifUrl = Gif.metadata?.src || Gif.url
            const Item = document.createElement("div")
            Item.className = "relative bg-gray-2 rounded-default h-64 w-full overflow-hidden"
            Item.dataset.index = DisplayIndex

            const ImgContainer = document.createElement("div")
            ImgContainer.className = "bg-transparent relative w-full h-full"

            const Img = document.createElement("img")
            Img.className = "absolute inset-0 w-full h-full object-contain"
            Img.loading = "lazy"
            Img.decoding = "async"
            Img.src = GifUrl

            const PositionContainer = document.createElement("div")
            PositionContainer.className = "absolute top-2 left-2 flex items-center"

            const PosLabel = document.createElement("span")
            PosLabel.className = "text-sm font-bold text-white px-2 py-1 rounded-l bg-black bg-opacity-70"
            PosLabel.textContent = "Pos"

            const PositionValue = document.createElement("span")
            PositionValue.className = "position-value text-sm font-bold text-white px-2 py-1 rounded-r bg-black bg-opacity-70 cursor-pointer"
            PositionValue.textContent = Gif.metadata?.e || "N/A"

            const RemoveBtn = document.createElement("button")
            RemoveBtn.className = "remove-btn absolute right-2 top-2 w-7 h-7 rounded bg-black flex items-center justify-center text-white cursor-pointer"
            RemoveBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`
            RemoveBtn.addEventListener("click", (E) => {
                E.stopPropagation()
                this.RemoveGif(DisplayIndex)
            })

            PositionValue.addEventListener("click", () => {
                const Input = document.createElement("input")
                Input.type = "text"
                Input.className = "text-sm font-bold text-white bg-black bg-opacity-90 px-2 py-1 rounded w-16 outline-none"
                Input.value = Gif.metadata?.e || ""

                PositionContainer.replaceChild(Input, PositionValue)
                Input.focus()
                Input.select()

                const HandleBlur = () => {
                    const NewPos = parseInt(Input.value)
                    const CurrentPos = Gif.metadata?.e || 1
                    const MaxPos = this.State.FilteredGifs.length

                    if (!isNaN(NewPos) && NewPos >= 1 && NewPos <= MaxPos && NewPos !== CurrentPos) {
                        this.UpdateGifPosition(DisplayIndex, NewPos)
                    }

                    PositionContainer.replaceChild(PositionValue, Input)
                    Input.removeEventListener("blur", HandleBlur)
                    Input.removeEventListener("keydown", HandleKeyDown)
                }

                const HandleKeyDown = (E) => {
                    if (E.key === "Enter") HandleBlur()
                }

                Input.addEventListener("blur", HandleBlur)
                Input.addEventListener("keydown", HandleKeyDown)
            })

            PositionContainer.appendChild(PosLabel)
            PositionContainer.appendChild(PositionValue)
            ImgContainer.appendChild(Img)
            Item.appendChild(ImgContainer)
            Item.appendChild(PositionContainer)
            Item.appendChild(RemoveBtn)
            Fragment.appendChild(Item)
        })

        GridContainer.appendChild(Fragment)

        if (this.State.SortableInstance) {
            this.State.SortableInstance.destroy()
        }

        this.State.SortableInstance = new Sortable(GridContainer, {
            animation: 150,
            ghostClass: "sortable-ghost",
            onEnd: () => this.UpdateLayoutOrder()
        })

        this.UpdateUndoButton()
    }

    UpdateGifPosition(CurrentIndex, NewPosition) {
        const BeforeState = JSON.parse(JSON.stringify(this.State.FilteredGifs))
        const UpdatedGifs = [...this.State.FilteredGifs]
        const TotalGifs = UpdatedGifs.length
        NewPosition = Math.max(1, Math.min(NewPosition, TotalGifs))

        const GifToMove = UpdatedGifs[CurrentIndex]
        if (!GifToMove) return

        if (!GifToMove.metadata) GifToMove.metadata = {}

        const CurrentPos = GifToMove.metadata.e || (TotalGifs - CurrentIndex)
        if (CurrentPos === NewPosition) return

        UpdatedGifs.forEach(gif => {
            if (!gif.metadata) gif.metadata = {}

            if (CurrentPos < NewPosition) {
                if (gif.metadata.e > CurrentPos && gif.metadata.e <= NewPosition) {
                    gif.metadata.e -= 1
                }
            } else {
                if (gif.metadata.e < CurrentPos && gif.metadata.e >= NewPosition) {
                    gif.metadata.e += 1
                }
            }
        })

        GifToMove.metadata.e = NewPosition
        this.State.FilteredGifs = UpdatedGifs.sort((a, b) => (a.metadata.e || 0) - (b.metadata.e || 0))

        this.State.ActionHistory.push({
            Action: "reposition",
            BeforeState: BeforeState,
        })

        this.RenderGifGrid()
        this.UpdateUndoButton()
    }

    RemoveGif(Index) {
        this.State.ActionHistory.push({
            Action: "remove",
            BeforeState: [...this.State.FilteredGifs]
        })
        this.State.FilteredGifs.splice(Index, 1)
        this.RenderGifGrid()
    }

    HandleUndo() {
        if (this.State.ActionHistory.length === 0) return

        const LastAction = this.State.ActionHistory.pop()
        this.State.FilteredGifs = JSON.parse(JSON.stringify(LastAction.BeforeState))

        this.RenderGifGrid()
        this.UpdateUndoButton()
    }

    UpdateUndoButton() {
        const HasHistory = this.State.ActionHistory.length > 0
        this.Elements.UndoBtn.classList.toggle("hidden", !HasHistory)
    }

    UpdateLayoutOrder() {
        const GridContainer = document.getElementById("GifGridContainer")
        if (!GridContainer) return

        const BeforeState = [...this.State.FilteredGifs]

        const Items = Array.from(GridContainer.children)
        this.State.FilteredGifs = Items.map((Item, NewIndex) => {
            const OriginalIndex = parseInt(Item.dataset.index)
            const OriginalGif = this.State.FilteredGifs[OriginalIndex]

            return {
                url: OriginalGif.url,
                metadata: {
                    format: OriginalGif.metadata.format,
                    src: OriginalGif.metadata.src,
                    width: OriginalGif.metadata.width,
                    height: OriginalGif.metadata.height,
                    e: Items.length - NewIndex
                }
            }
        })

        this.State.ActionHistory.push({
            Action: "reorder",
            BeforeState: BeforeState
        })

        this.RenderGifGrid()
    }

    GenerateUniqueIdFromData(Data) {
        try {
            let DataString
            if (typeof Data === "object" && Data !== null) {
                DataString = JSON.stringify(Data)
            } else if (typeof Data === "string") {
                try {
                    const Parsed = JSON.parse(Data)
                    DataString = JSON.stringify(Parsed)
                } catch (Error) {
                    DataString = Data
                }
            } else {
                DataString = String(Data)
            }

            const HashBuffer = new Uint8Array(32)
            if (typeof crypto !== "undefined" && crypto.getRandomValues) {
                crypto.getRandomValues(HashBuffer)
            } else {
                for (let i = 0; i < 32; i++) HashBuffer[i] = Math.floor(Math.random() * 256)
            }

            const HashBase64 = btoa(String.fromCharCode(...HashBuffer))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "")
                .substring(0, 30)
            return HashBase64
        } catch (Error) {
            const FallbackId = typeof Data === "string" ? Data.slice(0, 30) : "fallback"
            return FallbackId.replace(/[+/=]/g, "_")
        }
    }

    ShowJsonView() {
        const ExportData = this.GetExportData()
        const FormattedJson = this.SyntaxHighlight(JSON.stringify(ExportData, null, 2))
        this.Elements.ExportPreview.innerHTML = FormattedJson
    }

    ShowBase64View() {
        try {
            const ExportData = this.GetExportData()
            const BinaryData = window.Processor.JsonToBase64(ExportData)
            const Base64String = typeof BinaryData === "string" && BinaryData.includes(",")
                ? this.ConvertByteStringToBase64(BinaryData)
                : BinaryData
            this.Elements.ExportPreview.textContent = Base64String
        } catch (Error) {
            this.Elements.ExportPreview.textContent = `Error: ${Error.message}`
        }
    }

    CopyJson() {
        const ExportData = this.GetExportData()
        navigator.clipboard.writeText(JSON.stringify(ExportData, null, 2))
            .then(() => this.ShowStatusMessage("JSON copied to clipboard!", "info"))
            .catch(() => this.ShowStatusMessage("Failed to copy JSON", "error"))
    }

    CopyBase64() {
        try {
            const ExportData = this.GetExportData()
            const BinaryData = window.Processor.JsonToBase64(ExportData)
            const Base64String = typeof BinaryData === "string" && BinaryData.includes(",")
                ? this.ConvertByteStringToBase64(BinaryData)
                : BinaryData
            navigator.clipboard.writeText(Base64String)
                .then(() => this.ShowStatusMessage("Base64 copied to clipboard!", "info"))
                .catch(() => this.ShowStatusMessage("Failed to copy Base64", "error"))
        } catch (Error) {
            this.ShowStatusMessage("Failed to generate Base64", "error")
        }
    }

    GetExportData() {
        const ExportGifs = [...this.State.FilteredGifs].sort((A, B) => (A.metadata?.e || 0) - (B.metadata?.e || 0))

        return {
            metadata: { versionQ: 1, timesFavoritedQ: ExportGifs.length },
            gifs: { favorites: ExportGifs, xQ: 0 },
        }
    }

    ExportJson() {
        const ExportData = this.GetExportData()
        const Unique = this.GenerateUniqueIdFromData(ExportData)
        const Data = new Blob([JSON.stringify(ExportData, null, 2)], { type: "application/json" })
        const Url = URL.createObjectURL(Data)
        const A = document.createElement("a")
        A.href = Url
        A.download = "gifs_export_" + Unique + ".json"
        A.click()
        URL.revokeObjectURL(Url)
    }

    ExportBase64() {
        try {
            const ExportData = this.GetExportData()
            const BinaryData = window.Processor.JsonToBase64(ExportData)
            const Base64String = typeof BinaryData === "string" && BinaryData.includes(",")
                ? this.ConvertByteStringToBase64(BinaryData)
                : BinaryData

            const Unique = this.GenerateUniqueIdFromData(Base64String)
            const Data = new Blob([Base64String], { type: "application/octet-stream" })
            const Url = URL.createObjectURL(Data)
            const A = document.createElement("a")
            A.href = Url
            A.download = "gifs_export_" + Unique + ".bin"
            A.click()
            URL.revokeObjectURL(Url)
        } catch (Error) {
            this.ShowStatusMessage("Export failed: " + Error.message, "error")
        }
    }

    ConvertByteStringToBase64(ByteString) {
        const ByteArray = ByteString.replace(/\s/g, "").split(",").map(Number)
        const UintArray = new Uint8Array(ByteArray)
        let BinaryString = ""
        UintArray.forEach(Byte => BinaryString += String.fromCharCode(Byte))
        return btoa(BinaryString)
    }

    SyntaxHighlight(Json) {
        Json = Json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        return Json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (Match) {
                let Class = "text-gray-4"
                if (/^"/.test(Match)) {
                    if (/:$/.test(Match)) {
                        Class = "text-purple-400"
                    } else {
                        Class = "text-green-400"
                    }
                } else if (/true|false/.test(Match)) {
                    Class = "text-blue-400"
                } else if (/null/.test(Match)) {
                    Class = "text-red-400"
                } else if (!isNaN(parseFloat(Match))) {
                    Class = "text-yellow-400"
                }
                return '<span class="' + Class + '">' + Match + '</span>'
            })
    }

    ShowStatusMessage(Message, Type = "info", Section = null) {
        console.log(`[${Type}] ${Message}`)

        const BackgroundColors = {
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
            style: { "box-shadow": "none", "background": BackgroundColors[Type] || BackgroundColors.Info, },
            className: "rounded-default",
            stopOnFocus: true
        }).showToast()
    }
}

const CheckProcessor = setInterval(() => {
    if (window.Processor) {
        clearInterval(CheckProcessor)
        const Curator = new GifCurator()
        window.Curator = Curator
    }
}, 100)
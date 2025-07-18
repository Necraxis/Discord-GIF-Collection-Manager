const Handler = require("./Handler")
const Processor = require("./Processor")
const Chalk = require("chalk")
const Clipboardy = require("copy-paste")
const Inquirer = require("inquirer")
const Table = require("table")
const Fs = require("fs")

const Prompt = Inquirer.createPromptModule()
let Token = null
let CurrentSelections = []
let IsPromptActive = false

function ClearConsole() {
  console.clear()
}

async function SafePrompt(Options) {
  IsPromptActive = true
  const Result = await Prompt(Options)
  IsPromptActive = false
  return Result
}

async function GetToken() {
  const Response = await SafePrompt({
    type: "password",
    name: "token",
    message: "Enter your Discord token:",
    mask: "*",
    validate: Input => Input.trim().length > 0 ? true : "Token cannot be empty"
  })

  Token = Response.token.trim()
}

async function SaveCurrentCollectionToJson() {
  try {
    const Current = await Handler.GetCurrentCollection(Token)
    const CleanCollection = {
      metadata: Current.metadata || { versionQ: 1, timesFavoritedQ: 0 },
      gifs: {
        favorites: Current.gifs?.favorites || [],
        xQ: Current.gifs?.xQ || 0
      },
      emoji: Current.emoji || { x: [] },
      xQ: Current.xQ || { x: [] }
    }

    const FileName = `gif_collection_${new Date().toLocaleDateString("en-CA").replace(/\//g, "-")}_${Date.now()}.json`
    const Json = JSON.stringify(CleanCollection, null, 2)

    Fs.writeFileSync(FileName, Json)
    await Clipboardy.copy.json(Json)

    console.log(Chalk.green(`\n\nSuccessfully saved collection to ${FileName} and copied its contents to clipboard.`))
    console.log(Chalk.blue("You can share this json data with others or use it for your own self."))

    await SafePrompt({
      type: "input",
      name: "continue",
      message: "Press Enter to continue..."
    })
  } catch (Error) {
    console.error(Chalk.red("Failed to save collection:"), Error)
  }
}

async function SaveCurrentCollectionToBase64() {
  try {
    const Current = await Handler.GetCurrentCollection(Token)
    const CleanCollection = {
      metadata: { versionQ: 1, timesFavoritedQ: 0 },
      gifs: {
        favorites: Current.gifs?.favorites || [],
        xQ: 0
      },
      emoji: { x: [] },
      xQ: { x: [] }
    }

    const FileName = `gif_collection_${new Date().toLocaleDateString("en-CA").replace(/\//g, "-")}_${Date.now()}.bin`
    const Base64 = Processor.JsonToBase64(CleanCollection)
    Fs.writeFileSync(FileName, Base64)
    Clipboardy.copy(Base64)

    console.log(Chalk.green(`\n\nSuccessfully saved collection to ${FileName} and copied its contents to clipboard.`))
    console.log(Chalk.blue("You can share this base64 string with others."))

    await SafePrompt({
      type: "input",
      name: "continue",
      message: "Press Enter to continue..."
    })
  } catch (Error) {
    console.error(Chalk.red("Failed to save base64 collection:"), Error)
  }
}

async function HandleClipboardInput() {
  try {
    const ClipboardContent = Clipboardy.paste()
    const TrimmedContent = ClipboardContent.trim()

    if (!TrimmedContent) {
      console.log(Chalk.yellow("Clipboard is empty!"))
      return
    }

    if (CurrentSelections.includes(TrimmedContent)) {
      console.log(Chalk.yellow("This collection is already in the list!"))
      return
    }

    try {
      const Data = Processor.Base64ToJson(TrimmedContent)
      if (!Data.gifs || !Data.gifs.favorites) {
        throw new Error("Invalid GIF collection format")
      }

      CurrentSelections.push(TrimmedContent)
      console.log(Chalk.green("Successfully added collection!"))
    } catch (Error) {
      console.error(Chalk.red("Invalid GIF token:"), Error.message)
    }
  } catch (Error) {
    console.error(Chalk.red("Failed to read clipboard:"), Error.message)
  }
}

function DisplayCollectionTable() {
  if (CurrentSelections.length === 0) {
    console.log(Chalk.yellow("No collections selected yet"))
    return
  }

  const TableData = [
    [Chalk.bold("Index"), Chalk.bold("Token Preview"), Chalk.bold("GIF Count")]
  ]

  CurrentSelections.forEach((Token, Index) => {
    try {
      const Data = Processor.Base64ToJson(Token)
      const GifCount = Data.gifs?.favorites?.length || 0
      const TokenPreview = Token.substring(0, 15) + "..."
      TableData.push([Index + 1, TokenPreview, GifCount])
    } catch {
      TableData.push([Index + 1, "Invalid Token", 0])
    }
  })

  console.log(Table.table(TableData))
}

async function CollectionSelectionMenu(Action) {
  while (true) {
    ClearConsole()
    DisplayCollectionTable()

    const Response = await SafePrompt({
      type: "list",
      name: "subAction",
      message: `${Action} Collection - Select Action`,
      choices: [
        { name: "Copy from clipboard", value: "clipboard" },
        { name: "Continue", value: "continue" },
        { name: "Exit", value: "exit" }
      ]
    })

    switch (Response.subAction) {
      case "clipboard":
        await HandleClipboardInput()
        break
      case "continue":
        if (CurrentSelections.length === 0 && Action === "Replace") {
          console.log(Chalk.yellow("Warning: No collections selected This will clear your collection"))
          const Confirmation = await SafePrompt({
            type: "confirm",
            name: "confirm",
            message: "Are you sure you want to continue with no collections?",
            default: false
          })
          if (!Confirmation.confirm) continue
        }
        return
      case "exit":
        const Confirmation = await SafePrompt({
          type: "confirm",
          name: "confirm",
          message: "Are you sure you want to exit? All selections will be lost",
          default: false
        })
        if (Confirmation.confirm) return
    }
  }
}

async function CombineCollectionMenu() {
  ClearConsole()
  CurrentSelections = []

  try {
    console.log(Chalk.blue("Getting your current collection..."))
    const Current = await Handler.GetCurrentCollection(Token)
    const Base64 = Processor.JsonToBase64(Current)
    CurrentSelections.push(Base64)
    console.log(Chalk.green(`Added your current collection (${Current.gifs?.favorites?.length || 0} GIFs) to combine list`))
  } catch (Error) {
    console.error(Chalk.red("Failed to get current collection:"), Error)
    await SafePrompt({
      type: "input",
      name: "continue",
      message: "Press Enter to continue..."
    })
    return
  }

  await CollectionSelectionMenu("Combine")

  if (CurrentSelections.length > 1) {
    console.log(Chalk.blue("\nCombining collections..."))
    try {
      await Handler.CombineCollection(Token, CurrentSelections.slice(1))
      const NewCount = (await Handler.GetCurrentCollection(Token)).gifs.favorites.length
      console.log(Chalk.green(`Successfully combined collections! You now have ${NewCount} GIFs`))
    } catch (Error) {
      console.error(Chalk.red("Failed to combine collections:"), Error)
    }
    await SafePrompt({
      type: "input",
      name: "continue",
      message: "Press Enter to continue..."
    })
  }
}

async function ReplaceCollectionMenu() {
  CurrentSelections = []
  await CollectionSelectionMenu("Replace")

  if (CurrentSelections.length > 0) {
    await Handler.ReplaceCollection(Token, CurrentSelections)
  }
}

async function MainMenu() {
  while (true) {
    ClearConsole()
    const Response = await SafePrompt({
      type: "list",
      name: "action",
      message: "Main Menu",
      choices: [
        { name: "Clear Collection", value: "clear" },
        { name: "Replace Collection", value: "replace" },
        { name: "Combine Collection", value: "combine" },
        { name: "Save Current Collection to JSON (Developer use)", value: "save_json" },
        { name: "Save Current Collection to Base64 (Sharing use)", value: "save_base64" },
        { name: "Exit", value: "exit" }
      ]
    })

    if (IsPromptActive) {
      console.log(Chalk.yellow("Please finish current prompt first!"))
      continue
    }

    switch (Response.action) {
      case "clear":
        await Handler.ClearCollection(Token)
        break
      case "replace":
        await ReplaceCollectionMenu()
        break
      case "combine":
        await CombineCollectionMenu()
        break
      case "save_json":
        await SaveCurrentCollectionToJson()
        break
      case "save_base64":
        await SaveCurrentCollectionToBase64()
        break
      case "exit":
        console.log(Chalk.blue("Goodbye!"))
        return
    }
  }
}

async function Start() {
  try {
    process.on("SIGINT", () => {
      ClearConsole()
      console.log(Chalk.blue("Goodbye!"))
      process.exit(0)
    })

    ClearConsole()

    console.log(Chalk.blue("Discord GIF Collection Manager"))
    console.log(Chalk.blue("=============================\n"))

    await GetToken()
    await MainMenu()
  } catch (Error) {
    if (Error.isTtyError) {
      console.error(Chalk.red("Prompt couldn't be rendered in current environment"))
    } else {
      console.error(Chalk.red("Fatal error:"), Error)
    }
    process.exit(1)
  }
}

Start().catch(Error => {
  console.error(Chalk.red("Fatal error:"), Error)
  process.exit(1)
})
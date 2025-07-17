const Processor = require("./Processor.js")
const Chalk = require("chalk")
const Axios = require("axios")
const Fs = require("fs")

async function GetCurrentCollection(Token) {
  const Response = await Axios.get("https://discord.com/api/v9/users/@me/settings-proto/2", {
    headers: { Authorization: Token }
  })
  return Processor.Base64ToJson(Response.data.settings)
}

async function SendUpdate(Token, Collection) {
  await Axios.patch("https://discord.com/api/v9/users/@me/settings-proto/2", {
    settings: Processor.JsonToBase64(Collection)
  }, {
    headers: {
      "Content-Type": "application/json",
      Authorization: Token
    }
  })
}

async function ClearCollection(Token) {
  try {
    const Collection = {
      metadata: {
        versionQ: 1,
        timesFavoritedQ: 0
      },
      gifs: {
        favorites: [],
        xQ: 0
      },
      emoji: {
        x: []
      },
      xQ: {
        x: []
      }
    }
    await SendUpdate(Token, Collection)
    return { success: true, message: "Successfully cleared your GIF collection!" }
  } catch (Error) {
    return { success: false, message: "Failed to clear collection: " + Error.message }
  }
}

async function ReplaceCollection(Token, List) {
  try {
    const Collection = {
      metadata: {
        versionQ: 1,
        timesFavoritedQ: 0
      },
      gifs: {
        favorites: [],
        xQ: 0
      },
      emoji: {
        x: []
      },
      xQ: {
        x: []
      }
    }

    for (const Item of List) {
      try {
        const Data = Processor.Base64ToJson(Item)
        if (Data.gifs && Data.gifs.favorites) {
          Collection.gifs.favorites.push(...Data.gifs.favorites)
        }
      } catch (Error) {
        console.error(Chalk.yellow(`Skipped invalid token: ${Error.message}`))
      }
    }

    await SendUpdate(Token, Collection)
    return { 
      success: true, 
      message: `Successfully replaced with ${Collection.gifs.favorites.length} GIFs!` 
    }
  } catch (Error) {
    return { success: false, message: "Failed to replace collection: " + Error.message }
  }
}

async function CombineCollection(Token, List) {
  try {
    const Current = await GetCurrentCollection(Token)
    const Combined = [...Current.gifs.favorites]

    for (const Item of List) {
      try {
        const Data = Processor.Base64ToJson(Item)
        if (Data.gifs && Data.gifs.favorites) {
          Combined.push(...Data.gifs.favorites)
        }
      } catch (Error) {
        console.error(Chalk.yellow(`Skipped invalid token: ${Error.message}`))
      }
    }

    Current.gifs.favorites = Combined
    await SendUpdate(Token, Current)
    return { 
      success: true, 
      message: `Successfully combined! Now have ${Combined.length} GIFs.` 
    }
  } catch (Error) {
    return { success: false, message: "Failed to combine collections: " + Error.message }
  }
}

async function SaveCollectionToJson(Token, FilePath = "gif_collection.json") {
  try {
    const Current = await GetCurrentCollection(Token)
    const CleanCollection = {
      metadata: Current.metadata || { versionQ: 1, timesFavoritedQ: 0 },
      gifs: {
        favorites: Current.gifs?.favorites || [],
        xQ: Current.gifs?.xQ || 0
      },
      emoji: Current.emoji || { x: [] },
      xQ: Current.xQ || { x: [] }
    }

    Fs.writeFileSync(FilePath, JSON.stringify(CleanCollection, null, 2))
    return { success: true, message: `Successfully saved collection to ${FilePath}` }
  } catch (Error) {
    return { success: false, message: "Failed to save JSON collection: " + Error.message }
  }
}

async function SaveCollectionToBase64(Token, FilePath = "gif_collection_base64.txt") {
  try {
    const Current = await GetCurrentCollection(Token)
    const CleanCollection = {
      metadata: { versionQ: 1, timesFavoritedQ: 0 },
      gifs: {
        favorites: Current.gifs?.favorites || [],
        xQ: 0
      },
      emoji: { x: [] },
      xQ: { x: [] }
    }

    const Base64 = Processor.JsonToBase64(CleanCollection)
    Fs.writeFileSync(FilePath, Base64)
    return { 
      success: true, 
      message: `Successfully saved cleaned collection to ${FilePath}`,
      base64: Base64 
    }
  } catch (Error) {
    return { success: false, message: "Failed to save Base64 collection: " + Error.message }
  }
}

module.exports = {
  GetCurrentCollection,
  ClearCollection,
  ReplaceCollection,
  CombineCollection,
  SaveCollectionToJson,
  SaveCollectionToBase64
}
const Protobuf = require("protobufjs")
const FileSystem = require("fs")

function CreateProtobufType() {
  const Root = Protobuf.Root.fromJSON({
    nested: {
      Settings: {
        fields: {
          metadata: { type: "Metadata", id: 1 },
          gifs: { type: "FavoritedGifs", id: 2 },
          emoji: { type: "FavoritedEmoji", id: 6 },
          xQ: { type: "Thing1Q", id: 4 }
        },
        nested: {
          Metadata: {
            fields: {
              versionQ: { type: "int32", id: 1 },
              timesFavoritedQ: { type: "int32", id: 3 }
            }
          },
          FavoritedGifs: {
            fields: {
              favorites: { rule: "repeated", type: "Gif", id: 1 },
              xQ: { type: "int32", id: 2 }
            },
            nested: {
              Gif: {
                fields: {
                  url: { type: "string", id: 1 },
                  metadata: { type: "GifMetadata", id: 2 }
                },
                nested: {
                  GifMetadata: {
                    fields: {
                      format: { type: "int32", id: 1 },
                      src: { type: "string", id: 2 },
                      width: { type: "int32", id: 3 },
                      height: { type: "int32", id: 4 },
                      e: { type: "int32", id: 5 }
                    }
                  }
                }
              }
            }
          },
          FavoritedEmoji: {
            fields: {
              x: { rule: "repeated", type: "EmojiFavorited", id: 1 }
            },
            nested: {
              EmojiFavorited: {
                fields: {
                  name: { type: "string", id: 1 },
                  Q: { type: "string", id: 2 }
                }
              }
            }
          },

          // I used some persons gist to find about this proto stuff, so im as clueless as he is.
          Thing1Q: {
            fields: {
              x: { rule: "repeated", type: "Thing2Q", id: 1 }
            },
            nested: {
              Thing2Q: {
                fields: {
                  a: { type: "fixed64", id: 1 },
                  b: { type: "Thing3Q", id: 2 }
                },
                nested: {
                  Thing3Q: {
                    fields: {
                      a: { type: "int32", id: 1 },
                      b: { type: "string", id: 2 },
                      c: { type: "int32", id: 3 },
                      d: { type: "int32", id: 4 }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  return Root.lookupType("Settings")
}

function Base64ToJson(Base64String) {
  try {
    const BinaryData = Buffer.from(Base64String, "base64")
    const SettingsType = CreateProtobufType()
    const Decoded = SettingsType.decode(BinaryData)
    return SettingsType.toObject(Decoded)
  } catch (Data) {
    throw new Error("Failed to decode Base64 to JSON: " + Data.message)
  }
}

function JsonToBase64(JsonData) {
  try {
    const SettingsType = CreateProtobufType()
    const Message = SettingsType.fromObject(JsonData)
    const BufferData = SettingsType.encode(Message).finish()

    return BufferData.toString("base64")
  } catch (Data) {
    throw new Error("Failed to encode JSON to Base64: " + Data.message)
  }
}

function SaveJsonToFile(FilePath, JsonData) {
  FileSystem.writeFileSync(FilePath, JSON.stringify(JsonData, null, 2))
}

function LoadJsonFromFile(FilePath) {
  return JSON.parse(FileSystem.readFileSync(FilePath))
}

module.exports = {
  Base64ToJson,
  JsonToBase64,
  SaveJsonToFile,
  LoadJsonFromFile
}
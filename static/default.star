# Axilla!

load("render.star", "render")

def main(config):
  text = config.get("text") or "AXILLA!"

  text_animation = []

  hex = [
    "00",
    "44",
    "88",
    "bb",
    "ff",
  ]

  for red in hex:
    for green in hex:
      for blue in hex:
        text_animation.append(
          render.WrappedText(
            content=text,
            color="#" + red + green + blue,
          )
        )

  return render.Root(
    delay = 150,
    child = render.Row(
    expanded=True,
    main_align="center",
    children = [
      render.Column(
        expanded=True,
        main_align="center",
        children = [
          render.Animation(
            children = text_animation,
          ),
        ],
      ),
    ],
  ),
)

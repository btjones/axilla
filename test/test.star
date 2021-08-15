load("render.star", "render")

def main(config):
  text = config.get("greeting") or "hi!"

  return render.Root(
    child = render.Row(
    expanded=True,
    main_align="center",
    children = [
      render.Text(
        content=text,
      )
    ],
  ),
)

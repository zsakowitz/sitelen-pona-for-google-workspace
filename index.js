// @ts-check

const el = document.createElement("p");

const REPLACEMENT_WHEN_DRAWN = " ";
const REPLACEMENT_WHEN_MEASURED = "‌";

console.info("[SITELEN PONA GOOGLE WORKSPACE] script instantiated");

const contextProto = CanvasRenderingContext2D.prototype;
console.info("[SITELEN PONA GOOGLE WORKSPACE] prototype found", contextProto);

/**
 * @typedef
 * {{ type: "replace" | "join"; local: string; docs: string; whitespace: boolean }}
 * ConfigItem
 */

function config() {
  /** @type {string | undefined} */
  let defaults = "nasin-nanpa";

  const matches = (document.title.match(/\[\[[^\[\]]+\]\]/g) || [])
    .map((d) => {
      const whitespace = d.includes("|");
      const data = ("" + d).slice(2, -2).replace(/\|/g, "");

      if (data.includes("@")) {
        const [local, docs] = data.split("@").map((x) => x.trim());

        return {
          type: /** @type {const} */ ("replace"),
          whitespace,
          local,
          docs: docs == "Arial" ? "Arial" : `docs-${docs}`,
        };
      } else if (data.includes(">")) {
        const [local, docs] = data.split(">").map((x) => x.trim());

        return {
          type: /** @type {const} */ ("join"),
          whitespace,
          local,
          docs: docs == "Arial" ? "Arial" : `docs-${docs}`,
        };
      } else {
        return undefined;
      }
    })
    .filter(
      /** @returns {x is ConfigItem} */
      (x) => {
        if (!x) {
          return false;
        }

        if (x.docs == "") {
          defaults = x.local;
          return false;
        }

        return true;
      }
    );

  if (matches.length == 0) {
    return {
      added: /** @type {string | undefined} */ (defaults),
      additions: [
        {
          type: /** @type {const} */ ("replace"),
          whitespace: false,
          local: "nasin-nanpa",
          docs: "docs-Arial Narrow",
        },
      ],
    };
  } else {
    return {
      added: /** @type {string | undefined} */ (defaults),
      additions: matches,
    };
  }
}

const font = /** @type {{
    configurable?: boolean;
    enumerable?: boolean;
    get(): any;
    set(v: any): void;
}} */ (Object.getOwnPropertyDescriptor(contextProto, "font"));
Object.defineProperty(contextProto, "font", {
  enumerable: true,
  configurable: true,
  get() {
    return font.get.call(this);
  },
  set(v) {
    console.info("[SITELEN PONA GOOGLE WORKSPACE] setting font to", v);

    const { added, additions } = config();

    for (const { type, local, docs } of additions) {
      if (
        type == "replace" &&
        (v.endsWith("'" + docs + "'") || v.endsWith('"' + docs + '"'))
      ) {
        font.set.call(this, v.slice(0, -2 - docs.length) + local);
        return;
      } else if (type == "replace" && v.endsWith(docs)) {
        font.set.call(this, v.slice(0, -docs.length) + local);
        return;
      } else if (
        type == "join" &&
        (v.endsWith("'" + docs + "'") ||
          v.endsWith('"' + docs + '"') ||
          v.endsWith(docs))
      ) {
        font.set.call(this, v + ", " + local);
        return;
      } else if (v.includes(local)) {
        return;
      }
    }

    if (added) {
      font.set.call(this, v + ", " + added);
    } else {
      font.set.call(this, v);
    }
  },
});

const fillText = contextProto.fillText;
contextProto.fillText = function (text, x, y, width) {
  const { additions } = config();
  const value = font.get.call(this);
  el.style.font = value;
  const actualValue = el.style.fontFamily;

  if (
    additions.some(
      ({ whitespace, local }) => !whitespace && actualValue == local
    )
  ) {
    fillText.call(
      this,
      text.replace(/ /g, REPLACEMENT_WHEN_DRAWN),
      x,
      y,
      width
    );
  } else {
    fillText.call(this, text, x, y, width);
  }
};

const strokeText = contextProto.strokeText;
contextProto.strokeText = function (text, x, y, width) {
  const { additions } = config();
  const value = font.get.call(this);
  el.style.font = value;
  const actualValue = el.style.fontFamily;

  if (
    additions.some(
      ({ whitespace, local }) => !whitespace && actualValue == local
    )
  ) {
    strokeText.call(
      this,
      text.replace(/ /g, REPLACEMENT_WHEN_DRAWN),
      x,
      y,
      width
    );
  } else {
    strokeText.call(this, text, x, y, width);
  }
};

const measureText = contextProto.measureText;
contextProto.measureText = function (text) {
  const { additions } = config();
  const value = font.get.call(this);
  el.style.font = value;
  const actualValue = el.style.fontFamily;

  if (
    additions.some(
      ({ whitespace, local }) => !whitespace && actualValue == local
    )
  ) {
    return measureText.call(
      this,
      text.replace(/ /g, REPLACEMENT_WHEN_MEASURED)
    );
  } else {
    return measureText.call(this, text);
  }
};

const getComputedTextLength = SVGTextElement.prototype.getComputedTextLength;
SVGTextElement.prototype.getComputedTextLength = function () {
  const { added, additions } = config();
  const value = this.style.fontFamily;

  for (const { type, whitespace, docs, local } of additions) {
    if (value.includes(docs)) {
      const value = this.textContent || "";
      if (!whitespace) {
        this.textContent = value.replace(/ /g, REPLACEMENT_WHEN_MEASURED);
      }
      if (!value.includes(local)) {
        if (type == "join") {
          this.style.fontFamily += ", " + local;
        } else {
          this.style.fontFamily = local;
        }
      }
      const length = getComputedTextLength.call(this);
      this.textContent = value;
      return length;
    }
  }

  if (added && !this.style.fontFamily.includes(added)) {
    this.style.fontFamily += ", " + added;
  }

  return getComputedTextLength.call(this);
};

function cycle() {
  const { added, additions } = config();

  const text = document.getElementsByTagNameNS(
    "http://www.w3.org/2000/svg",
    "text"
  );

  outer: for (const el of text) {
    const value = el.style.fontFamily;

    for (const { type, docs, local } of additions) {
      if (value.includes(docs) && !value.includes(local)) {
        if (type == "join") {
          el.style.fontFamily += ", " + local;
        } else {
          el.style.fontFamily = local;
        }
        continue outer;
      } else if (value.includes(local)) {
        continue outer;
      }
    }

    if (added && !value.includes(added)) {
      el.style.fontFamily += ", " + added;
    }
  }
}

setInterval(cycle);

requestAnimationFrame(function self() {
  cycle();
  requestAnimationFrame(self);
});

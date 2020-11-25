import { registerPlugin, transformFromAst, transform } from "@babel/standalone";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as t from "babel-types";

let cached;
let ast;
const Reflect = (window.Reflect = {
  colorNodes: [],
  textNodes: [],
  marginNodes: [],
  easterEggPath: null,
  changeColor: (color) => {
    Reflect.colorNodes.forEach((n) => (n.value = color));
    Reflect.colorNodes = [];
    localStorage.setItem("comp", JSON.stringify(ast));
    ast = cached = null;
  },
  changeText: (text) => {
    if (text === "彩蛋") Reflect.surprise();
    Reflect.textNodes.forEach((n) => (n.value = text));
    Reflect.textNodes = [];
    localStorage.setItem("comp", JSON.stringify(ast));
    ast = cached = null;
  },
  changeMargin: (margin) => {
    Reflect.marginNodes.forEach((n) => (n.value = margin));
    Reflect.marginNodes = [];
    localStorage.setItem("comp", JSON.stringify(ast));
    ast = cached = null;
  },
  surprise: () => {
    Reflect.easterEggPath?.insertBefore(
      t.callExpression(t.identifier("alert"), [
        t.stringLiteral("Ha! Easter Egg!"),
      ])
    );
  },
});

const tag = (path) => path?.node?.leadingComments?.[0]?.value;
const visitPath = (path) => {
  if (!ast) {
    let root = path;
    while (root.parentPath) root = root.parentPath;
    ast = root.parent;
  }
  switch (tag(path)) {
    case "color":
      Reflect.colorNodes?.push(path.node);
      break;
    case "text":
      Reflect.textNodes?.push(path.node);
      break;
    case "margin":
      Reflect.marginNodes?.push(path.node);
      break;
    case "easter-egg":
      Reflect.easterEggPath = path;
      break;
  }
};

registerPlugin("test", () => {
  return {
    visitor: {
      Expression: visitPath,
      Statement: visitPath,
    },
  };
});

function getComponent() {
  if (cached) return cached;

  let ast;
  if (!localStorage.getItem("comp")) {
    const result = transform(
      `({ forceUpdate }) => {
        const [color, setColor] = React.useState(/*color*/ '#e66465');
        const [text, setText] = React.useState(/*text*/ 'THIS IS A TEST');
        const [margin, setMargin] = React.useState(/*margin*/ 10);

        return (
          <div>
            <div style={{ margin }}>
              <input
                type='number'
                value={margin}
                onChange={e => setMargin(+e.target.value)}
                onBlur={() => {
                  Reflect.changeMargin(margin);
                  forceUpdate();
                }}
              />
            </div>
            <div style={{ margin }}>
              <input
                type='color'
                value={color}
                onChange={e => setColor(e.target.value)}
                onBlur={() => {
                  Reflect.changeColor(color);
                  forceUpdate();
                }}
              />
            </div>
            <div style={{ margin }}>
              <input
                type='text'
                value={text}
                onChange={e => setText(e.target.value)}
                onBlur={() => {
                  /*easter-egg*/
                  Reflect.changeText(text);
                  forceUpdate();
                }}
              />
            </div>
            <div
              style={{ 
                margin,
                color,
                fontFamily: 'sans-serif',
                fontWeight: 800,
                fontSize: margin,
              }}
            >
              {text + \` (\${margin}px)\`}
            </div>
          </div>
        );
      }`,
      {
        ast: true,
        presets: ["react"],
      }
    );
    ast = result.ast;
    localStorage.setItem("comp", JSON.stringify(ast));
  } else {
    ast = JSON.parse(localStorage.getItem("comp"));
  }

  const { code } = transformFromAst(ast, null, {
    plugins: ["test"],
  });

  const Component = new Function("React", "return " + code)(React);

  return (cached = Component);
}

const useForceUpdate = () => {
  const [, setTick] = React.useState(0);
  const update = React.useCallback(() => {
    setTick((tick) => tick + 1);
  }, []);
  return update;
};

const App = () => {
  const Comp = getComponent();
  console.log(Comp);
  const forceUpdate = useForceUpdate();
  return React.createElement(Comp, { forceUpdate });
};

ReactDOM.render(React.createElement(App), document.body);

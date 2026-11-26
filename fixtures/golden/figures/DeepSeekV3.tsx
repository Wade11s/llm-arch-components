import type { FigureProps } from "./types";

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const TITLE_FONT = "'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";
const BLACK = "#000000";
const WHITE = "#ffffff";
const GRAY = "#d5d5d5";
const CORAL = "#ff968d";
const ACCENT = "#ff644e";
const DARK = "#5e5e5e";
const BADGE_RED = "#ee220c";

type LabelBoxProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fill?: string;
  radius?: number;
  fontSize?: number;
  labelFill?: string;
  stroke?: string;
  strokeWidth?: number;
};

function LabelBox({
  x,
  y,
  width,
  height,
  label,
  fill = WHITE,
  radius = 24,
  fontSize = 40,
  labelFill = BLACK,
  stroke = BLACK,
  strokeWidth = 5,
}: LabelBoxProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fill={labelFill}
      >
        {label}
      </text>
    </g>
  );
}

function PlusNode({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const arm = r * 0.62;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={WHITE} stroke={BLACK} strokeWidth={5} />
      <path
        d={"M " + (cx - arm) + " " + cy + " H " + (cx + arm) + " M " + cx + " " + (cy - arm) + " V " + (cy + arm)}
        fill="none"
        stroke={BLACK}
        strokeWidth={5}
        strokeLinecap="square"
      />
    </g>
  );
}

function Otimes({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const d = r * 0.58;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={GRAY} stroke={BLACK} strokeWidth={4} />
      <path
        d={
          "M " +
          (cx - d) +
          " " +
          (cy - d) +
          " L " +
          (cx + d) +
          " " +
          (cy + d) +
          " M " +
          (cx + d) +
          " " +
          (cy - d) +
          " L " +
          (cx - d) +
          " " +
          (cy + d)
        }
        fill="none"
        stroke={BLACK}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </g>
  );
}

type FlowArrowProps = {
  d: string;
  markerId: string;
  stroke?: string;
  strokeWidth?: number;
};

function FlowArrow({ d, markerId, stroke = BLACK, strokeWidth = 6 }: FlowArrowProps) {
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      markerEnd={"url(#" + markerId + ")"}
    />
  );
}

export function DeepSeekV3({ idPrefix }: FigureProps) {
  const titleId = idPrefix + "-title";
  const descId = idPrefix + "-desc";
  const arrowId = idPrefix + "-arrow";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2786 2725"
      width="2786"
      height="2725"
      role="img"
      aria-labelledby={titleId + " " + descId}
      fontFamily={SANS}
      fill={BLACK}
    >
      <title id={titleId}>DeepSeek-V3 (671B) architecture</title>
      <desc id={descId}>
        A vertical block diagram of DeepSeek-V3. Tokenized text is embedded into a 7,168-dimensional
        space, then passed through 61 repeated blocks of multi-head latent attention and a
        mixture-of-experts feed forward layer. Insets show the SwiGLU expert module and the router
        selecting one shared plus eight of 256 experts.
      </desc>

      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 32 28"
          refX="31"
          refY="14"
          markerWidth="32"
          markerHeight="28"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M 0 0 L 32 14 L 0 28 Z" fill={BLACK} />
        </marker>
      </defs>

      <rect x="0" y="0" width="2786" height="2725" fill={WHITE} />

      <g data-element="title">
        <text
          x="422"
          y="128"
          fontFamily={TITLE_FONT}
          fontSize={138}
          fontWeight={900}
          letterSpacing={-3}
          textLength={1380}
          lengthAdjust="spacingAndGlyphs"
          fill={ACCENT}
        >
          DeepSeek-V3 (671B)
        </text>
      </g>

      <g data-element="backbone">
        <rect
          x="457"
          y="359"
          width="1097"
          height="2053"
          rx="55"
          fill={GRAY}
          stroke={BLACK}
          strokeWidth={5}
        />

        <rect
          x="633"
          y="702"
          width="778"
          height="1225"
          rx="55"
          fill={CORAL}
          stroke={BLACK}
          strokeWidth={5}
        />

        <g data-element="repeated-block">
          <LabelBox x={828} y={420} width={375} height={84} label="Linear output layer" />
          <LabelBox x={840} y={560} width={350} height={86} label="Final RMSNorm" />
          <LabelBox x={837} y={927} width={353} height={86} label="MoE" fill={GRAY} />
          <LabelBox x={837} y={1103} width={353} height={86} label="RMSNorm 2" />
          <LabelBox x={836} y={1701} width={350} height={87} label="RMSNorm 1" />
          <LabelBox
            x={747}
            y={2116}
            width={536}
            height={91}
            label="Token embedding layer"
          />
          <LabelBox x={837} y={2447} width={350} height={90} label="Tokenized text" />
          <LabelBox x={399} y={1489} width={283} height={94} label="Partial RoPE" fontSize={38} />

          <rect
            x="775"
            y="1454"
            width="428"
            height="160"
            rx="18"
            fill={DARK}
            stroke={BLACK}
            strokeWidth={5}
          />
          <text x="989" y="1526" textAnchor="middle" fontSize={38} fill={WHITE}>
            Multi-head <tspan fontStyle="italic" fill={ACCENT}>latent</tspan>
          </text>
          <text x="989" y="1572" textAnchor="middle" fontSize={38} fill={WHITE}>
            attention
          </text>

          <FlowArrow d="M 1014 2447 V 2207" markerId={arrowId} strokeWidth={5} />
          <FlowArrow d="M 1014 2116 V 1788" markerId={arrowId} />
          <FlowArrow d="M 1014 1701 V 1614" markerId={arrowId} />
          <FlowArrow d="M 1014 1454 V 1390" markerId={arrowId} />
          <FlowArrow d="M 1014 1322 V 1189" markerId={arrowId} />
          <FlowArrow d="M 1014 1103 V 1013" markerId={arrowId} />
          <FlowArrow d="M 1014 927 V 833" markerId={arrowId} />
          <FlowArrow d="M 1014 765 V 646" markerId={arrowId} />
          <FlowArrow d="M 1014 560 V 504" markerId={arrowId} />
          <FlowArrow d="M 1014 420 V 282" markerId={arrowId} />

          <FlowArrow d="M 682 1536 H 773" markerId={arrowId} />

          <g data-element="residual-merges">
            <FlowArrow d="M 1014 1803 H 1256 V 1356 H 1049" markerId={arrowId} />
            <FlowArrow d="M 1014 1247 H 1256 V 800 H 1049" markerId={arrowId} />
          </g>

          <PlusNode cx={1014} cy={1356} r={34} />
          <PlusNode cx={1014} cy={799} r={34} />
        </g>

        <g data-element="input">
          <FlowArrow d="M 1014 2616 V 2543" markerId={arrowId} />
          <text
            x="786"
            y="2694"
            fontFamily={MONO}
            fontSize={40}
            letterSpacing={2}
            fill={BLACK}
          >
            Sample input text
          </text>
        </g>
      </g>

      <g data-element="ffn-inset">
        <text x="1883" y="342" fontSize={52} fontWeight={700}>
          Feed forward <tspan fontStyle="italic">(SwiGLU)</tspan> module
        </text>

        <rect
          x="1886"
          y="369"
          width="788"
          height="610"
          rx="55"
          fill={GRAY}
          stroke={BLACK}
          strokeWidth={9}
          strokeDasharray="0.1 19"
          strokeLinecap="square"
        />

        <LabelBox x={1936} y={421} width={335} height={105} label="Linear layer" radius={28} />
        <LabelBox x={1937} y={622} width={334} height={104} label="SiLU activation" radius={28} />
        <LabelBox x={2293} y={622} width={334} height={104} label="Linear layer" radius={28} />
        <LabelBox x={1936} y={817} width={335} height={104} label="Linear layer" radius={28} />

        <FlowArrow d="M 2104 817 V 726" markerId={arrowId} />
        <FlowArrow d="M 2104 622 V 526" markerId={arrowId} />

        <path
          d="M 2104 573 H 2259 M 2317 573 H 2453 V 622"
          fill="none"
          stroke={BLACK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <Otimes cx={2288} cy={573} r={29} />
      </g>

      <g data-element="moe-inset">
        <rect
          x="1748"
          y="1250"
          width="943"
          height="952"
          rx="55"
          fill={WHITE}
          stroke={ACCENT}
          strokeWidth={11}
          strokeDasharray="0.1 21"
          strokeLinecap="square"
        />

        <text x="2366" y="1375" fontSize={52} fontWeight={700}>
          MoE layer
        </text>

        <LabelBox
          x={1767}
          y={1615}
          width={350}
          height={84}
          label="Feed forward"
          fill={GRAY}
          radius={20}
        />
        <LabelBox
          x={2278}
          y={1615}
          width={350}
          height={84}
          label="Feed forward"
          fill={GRAY}
          radius={20}
        />

        <rect x="2050" y="1694" width="78" height="76" rx="14" fill={BLACK} />
        <text x="2089" y="1752" textAnchor="middle" fontSize={40} fontWeight={700} fill={WHITE}>
          1
        </text>

        <rect x="2528" y="1678" width="120" height="76" rx="14" fill={BADGE_RED} />
        <text x="2588" y="1736" textAnchor="middle" fontSize={40} fontWeight={700} fill={WHITE}>
          256
        </text>

        <g data-element="moe-router">
          <rect
            x="2097"
            y="1930"
            width="202"
            height="100"
            rx="20"
            fill={WHITE}
            stroke={ACCENT}
            strokeWidth={9}
          />
          <text x="2198" y="1994" textAnchor="middle" fontSize={42}>
            Router
          </text>
        </g>

        <FlowArrow d="M 2200 2160 V 2033" markerId={arrowId} />
        <FlowArrow d="M 2200 1915 V 1503" markerId={arrowId} />
        <FlowArrow d="M 2200 1915 L 2050 1702" markerId={arrowId} />
        <FlowArrow d="M 2200 1915 L 2350 1702" markerId={arrowId} />
        <FlowArrow d="M 2070 1615 L 2175 1480" markerId={arrowId} />
        <FlowArrow d="M 2430 1615 L 2226 1480" markerId={arrowId} />
        <FlowArrow d="M 2200 1429 V 1272" markerId={arrowId} />

        <g fill={BLACK}>
          <rect x="2147" y="1680" width="14" height="14" />
          <rect x="2192" y="1680" width="14" height="14" />
          <rect x="2237" y="1680" width="14" height="14" />
        </g>

        <PlusNode cx={2200} cy={1465} r={36} />
      </g>

      <g data-element="callouts">
        <text x="1279" y="260" fontSize={52} fontWeight={700}>
          Vocabulary size of <tspan fill={ACCENT}>129k</tspan>
        </text>

        <text x="28" y="1874" fontSize={52} fontWeight={700}>
          YaRN context
        </text>
        <text x="32" y="1935" fontSize={52} fontWeight={700}>
          <tspan fill={ACCENT}>128k</tspan>
          <tspan x="161">tokens</tspan>
        </text>
        <text x="29" y="1996" fontSize={52} fontWeight={700}>
          <tspan fill={ACCENT}>4k</tspan>
          <tspan x="105">RoPE</tspan>
          <tspan x="260">base</tspan>
        </text>

        <text x="22" y="2463" fontSize={52} fontWeight={700}>
          First <tspan fill={ACCENT}>3</tspan> blocks use
        </text>
        <text x="20" y="2524" fontSize={52} fontWeight={700}>
          dense FFN with
        </text>
        <text x="22" y="2585" fontSize={52} fontWeight={700}>
          hidden size <tspan fill={ACCENT}>18,432</tspan>
        </text>
        <text x="22" y="2646" fontSize={52} fontWeight={700}>
          instead of MoE
        </text>

        <text x="1603" y="2449" fontSize={52} fontWeight={700}>
          <tspan fill={ACCENT}>128</tspan> heads
        </text>

        <text x="1377" y="2636" fontSize={52} fontWeight={700}>
          Embedding
        </text>
        <text x="1375" y="2696" fontSize={52} fontWeight={700}>
          dimension of <tspan fill={ACCENT}>7,168</tspan>
        </text>

        <text x="2135" y="1059" fontSize={52} fontWeight={700}>
          Intermediate hidden
        </text>
        <text x="2136" y="1119" fontSize={52} fontWeight={700}>
          layer dimension of
        </text>
        <text x="2133" y="1181" fontSize={52} fontWeight={700} fill={ACCENT}>
          2,048
        </text>
      </g>

      <g
        data-element="leaders"
        fill="none"
        stroke={BLACK}
        strokeWidth={10}
        strokeDasharray="0.1 20"
        strokeLinecap="square"
      >
        <path d="M 1295 276 L 1203 417" />
        <path d="M 370 1818 L 408 1578" />
        <path d="M 385 2405 L 637 1912" />
        <path d="M 1210 1570 L 1590 2392" />
        <path d="M 1283 2195 L 1367 2584" />
        <path d="M 1948 980 L 1785 1618" />
        <path d="M 2232 980 L 2300 1018" />
      </g>
      <path
        data-element="moe-leader"
        d="M 1193 1000 L 1746 1252"
        fill="none"
        stroke={ACCENT}
        strokeWidth={10}
        strokeDasharray="0.1 20"
        strokeLinecap="square"
      />

      <g data-element="repeat-brace">
        <path
          d="M 630 1822 C 610 1822 608 1846 610 1866 L 594 1884 L 610 1902 C 608 1922 610 1956 630 1956"
          fill="none"
          stroke={BLACK}
          strokeWidth={9}
          strokeLinecap="round"
        />
        <text x="483" y="1962" fontSize={50} fontWeight={700} fill={ACCENT}>
          61 &times;
        </text>
      </g>

      <g data-element="resource-savings">
        <text x="1965" y="2284" fontSize={52} fontWeight={700} fill={ACCENT}>
          Resource savings:
        </text>
        <circle cx="1977" cy="2350" r="7" fill={BLACK} />
        <text x="2025" y="2361" fontSize={52}>
          Model size is <tspan fill={ACCENT}>671B</tspan>
        </text>
        <circle cx="1977" cy="2425" r="7" fill={BLACK} />
        <text x="2025" y="2436" fontSize={52}>
          but only <tspan fill={ACCENT}>1 (shared) + 8 experts</tspan>
        </text>
        <text x="2025" y="2495" fontSize={52}>
          active per token
        </text>
        <circle cx="1977" cy="2561" r="7" fill={BLACK} />
        <text x="2024" y="2572" fontSize={52}>
          only <tspan fill={ACCENT}>37B</tspan> parameters are active
        </text>
        <text x="2024" y="2630" fontSize={52}>
          per inference step
        </text>
      </g>
    </svg>
  );
}

import type { FigureProps } from "./types";

const FONT = "'Segoe UI', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif";
const MONO = "'SF Mono', 'Roboto Mono', Menlo, Consolas, 'Liberation Mono', monospace";

const INK = "#000000";
const PURPLE = "#8b42e2";
const BLOCK_PURPLE = "#b393da";
const PANEL_GRAY = "#d5d5d5";
const ATTENTION_DARK = "#5e5e5e";

type LabelBoxProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fill?: string;
  stroke?: string;
  radius?: number;
  fontSize?: number;
  textFill?: string;
  dataElement?: string;
};

/** Small rounded label box used throughout the main backbone and the insets. */
function LabelBox({
  x,
  y,
  width,
  height,
  label,
  fill = "#ffffff",
  stroke = INK,
  radius = 20,
  fontSize = 38,
  textFill = INK,
  dataElement,
}: LabelBoxProps) {
  return (
    <g data-element={dataElement}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={6}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fill={textFill}
      >
        {label}
      </text>
    </g>
  );
}

export function GptOss120b({ idPrefix }: FigureProps) {
  const arrowId = `${idPrefix}-arrow`;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2904 2699"
      width={2904}
      height={2699}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>gpt-oss 120B architecture</title>
      <desc id={descId}>
        A transformer diagram for gpt-oss 120B. Tokenized text is embedded into a 2,880-dimensional
        space, then passed through a repeated block stack of 36 layers. Each block has grouped-query
        attention with 64 heads, RMSNorm layers, and a mixture-of-experts layer with 128 experts, of
        which 4 are active per token. A final RMSNorm and linear output layer produce the 200k-token
        vocabulary. Callouts give the YaRN context settings, expert dimensions, SwiGLU feed-forward
        structure, and the 5.1B active parameter count.
      </desc>

      <defs>
        <marker
          id={arrowId}
          markerWidth={30}
          markerHeight={32}
          refX={30}
          refY={16}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0 0 L30 16 L0 32 Z" fill={INK} />
        </marker>
      </defs>

      <rect width={2904} height={2699} fill="#ffffff" />

      <g fontFamily={FONT} fill={INK}>
        <g data-element="title">
          <text
            x={590}
            y={136}
            fontSize={136}
            fontWeight={700}
            fill={PURPLE}
            letterSpacing={-2}
            textLength={930}
            lengthAdjust="spacing"
          >
            gpt-oss (120B)
          </text>
        </g>

        {/* Model container and repeated transformer block. */}
        <g data-element="backbone">
          <rect
            x={450}
            y={331}
            width={1100}
            height={2054}
            rx={58}
            fill={PANEL_GRAY}
            stroke={INK}
            strokeWidth={6}
          />

          <g data-element="repeated-block">
            <rect
              x={626}
              y={672}
              width={779}
              height={1228}
              rx={70}
              fill={BLOCK_PURPLE}
              stroke={INK}
              strokeWidth={6}
            />
          </g>
        </g>

        {/* Inset backgrounds sit behind the dotted leaders. */}
        <g data-element="ffn-inset-background">
          <rect
            x={1877}
            y={340}
            width={791}
            height={610}
            rx={44}
            fill={PANEL_GRAY}
            stroke={INK}
            strokeWidth={7}
            strokeDasharray="6 8"
            strokeLinecap="butt"
          />
          <text x={2272} y={315} textAnchor="middle" fontSize={54} fontWeight={700}>
            Feed forward (SwiGLU) module
          </text>
        </g>

        <g data-element="moe-inset-background">
          <rect
            x={1729}
            y={1213}
            width={968}
            height={935}
            rx={58}
            fill="#ffffff"
            stroke={PURPLE}
            strokeWidth={8}
            strokeDasharray="8 11"
            strokeLinecap="butt"
          />
          <text x={2630} y={1302} textAnchor="end" fontSize={54} fontWeight={700}>
            MoE layer
          </text>
        </g>

        {/* Dotted leaders and zoom connectors. */}
        <g
          data-element="leaders"
          fill="none"
          stroke={INK}
          strokeWidth={8}
          strokeDasharray="8 14"
          strokeLinecap="butt"
        >
          <path d="M1320 238 L1186 392" />
          <path d="M300 1812 L378 1598" />
          <path d="M1198 1590 L1600 2340" />
          <path d="M1276 2181 L1352 2545" />
          <path d="M1955 950 L1810 1601" />
          <path d="M2215 950 L2272 1015" />
        </g>
        <path
          data-element="moe-leader"
          d="M1182 944 L1736 1290"
          fill="none"
          stroke={PURPLE}
          strokeWidth={8}
          strokeDasharray="8 12"
          strokeLinecap="butt"
        />

        {/* Main backbone contents. */}
        <g data-element="backbone-contents">
          <LabelBox
            x={832}
            y={392}
            width={354}
            height={85}
            label="Linear output layer"
            dataElement="output-layer"
          />
          <LabelBox x={837} y={536} width={344} height={83} label="Final RMSNorm" />
          <LabelBox x={834} y={902} width={344} height={84} label="MoE" fill={PANEL_GRAY} />
          <LabelBox x={833} y={1078} width={346} height={84} label="RMSNorm 2" />
          <LabelBox x={831} y={1676} width={346} height={84} label="RMSNorm 1" />
          <LabelBox
            x={743}
            y={2090}
            width={529}
            height={88}
            label="Token embedding layer"
            dataElement="token-embedding"
          />
          <LabelBox x={832} y={2424} width={346} height={83} label="Tokenized text" />
          <LabelBox x={385} y={1466} width={298} height={85} label="RoPE" fontSize={38} />

          {/* Grouped-query attention uses a dark block with two lines of white text. */}
          <g data-element="attention">
            <rect
              x={768}
              y={1428}
              width={427}
              height={160}
              rx={22}
              fill={ATTENTION_DARK}
              stroke={INK}
              strokeWidth={6}
            />
            <text
              x={982}
              y={1494}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={38}
              fill="#ffffff"
            >
              Grouped-query
            </text>
            <text
              x={982}
              y={1538}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={38}
              fill="#ffffff"
            >
              attention
            </text>
          </g>

          {/* Backbone arrows. */}
          <g
            stroke={INK}
            strokeWidth={6}
            fill="none"
            markerEnd={`url(#${arrowId})`}
            data-element="backbone-flow"
          >
            <line x1={1004} y1={392} x2={1004} y2={258} />
            <line x1={1004} y1={536} x2={1004} y2={481} />
            <line x1={1004} y1={736} x2={1004} y2={623} />
            <line x1={1004} y1={902} x2={1004} y2={808} />
            <line x1={1004} y1={1078} x2={1004} y2={990} />
            <line x1={1004} y1={1296} x2={1004} y2={1166} />
            <line x1={1004} y1={1428} x2={1004} y2={1368} />
            <line x1={1004} y1={1676} x2={1004} y2={1592} />
            <line x1={1004} y1={2090} x2={1004} y2={1764} />
            <line x1={683} y1={1508} x2={760} y2={1508} />
            <line x1={1004} y1={2635} x2={1004} y2={2512} />
          </g>

          {/* Embedding to tokenized-text link has no arrowhead in the reference. */}
          <line
            x1={1004}
            y1={2422}
            x2={1004}
            y2={2178}
            stroke={INK}
            strokeWidth={6}
            fill="none"
          />

          {/* Residual connections around attention and MoE. */}
          <g stroke={INK} strokeWidth={6} fill="none" data-element="residuals">
            <path d="M1004 1863 H1250 V1330" />
            <path d="M1004 1265 H1250 V770" />
          </g>
          <g stroke={INK} strokeWidth={6} fill="none" markerEnd={`url(#${arrowId})`}>
            <line x1={1250} y1={1330} x2={1039} y2={1330} />
            <line x1={1250} y1={770} x2={1041} y2={770} />
          </g>

          <g data-element="residual-merges">
            <circle cx={1007} cy={770} r={34} fill={BLOCK_PURPLE} stroke={INK} strokeWidth={6} />
            <path d="M987 770 H1027 M1007 750 V790" stroke={INK} strokeWidth={5} />
            <circle cx={1005} cy={1330} r={34} fill={BLOCK_PURPLE} stroke={INK} strokeWidth={6} />
            <path d="M985 1330 H1025 M1005 1310 V1350" stroke={INK} strokeWidth={5} />
          </g>
        </g>

        {/* FFN (SwiGLU) detail inset. */}
        <g data-element="ffn-inset">
          <LabelBox
            x={1929}
            y={397}
            width={336}
            height={100}
            label="Linear layer"
            radius={22}
            fontSize={42}
          />
          <LabelBox
            x={1929}
            y={598}
            width={336}
            height={100}
            label="SiLU activation"
            radius={22}
            fontSize={40}
          />
          <LabelBox
            x={2285}
            y={598}
            width={336}
            height={100}
            label="Linear layer"
            radius={22}
            fontSize={42}
          />
          <LabelBox
            x={1929}
            y={792}
            width={336}
            height={100}
            label="Linear layer"
            radius={22}
            fontSize={42}
          />

          <g stroke={INK} strokeWidth={6} fill="none" data-element="ffn-flow">
            <line x1={2097} y1={792} x2={2097} y2={702} markerEnd={`url(#${arrowId})`} />
            <line x1={2097} y1={598} x2={2097} y2={501} markerEnd={`url(#${arrowId})`} />
            <line x1={2097} y1={552} x2={2254} y2={552} />
            <path d="M2308 552 H2449 V598" />
          </g>

          <g data-element="ffn-multiply">
            <circle cx={2281} cy={552} r={27} fill="#ffffff" stroke={INK} strokeWidth={6} />
            <path
              d="M2267 538 L2295 566 M2295 538 L2267 566"
              stroke={INK}
              strokeWidth={5}
              fill="none"
            />
          </g>
        </g>

        {/* Mixture-of-experts detail inset. */}
        <g data-element="moe-inset">
          <g
            stroke={INK}
            strokeWidth={6}
            fill="none"
            markerEnd={`url(#${arrowId})`}
            data-element="moe-flow"
          >
            <line x1={2194} y1={2075} x2={2194} y2={2012} />
            <line x1={2194} y1={1907} x2={2194} y2={1452} />
            <line x1={2144} y1={1907} x2={1937} y2={1683} />
            <line x1={2244} y1={1907} x2={2448} y2={1683} />
            <line x1={2062} y1={1601} x2={2166} y2={1442} />
            <line x1={2360} y1={1601} x2={2222} y2={1442} />
            <line x1={2194} y1={1368} x2={2194} y2={1268} />
          </g>

          <LabelBox
            x={1762}
            y={1601}
            width={348}
            height={82}
            label="Feed forward"
            fill={PANEL_GRAY}
            radius={18}
            fontSize={39}
            dataElement="moe-expert-first"
          />
          <LabelBox
            x={2273}
            y={1601}
            width={347}
            height={82}
            label="Feed forward"
            fill={PANEL_GRAY}
            radius={18}
            fontSize={39}
            dataElement="moe-expert-last"
          />

          <g data-element="moe-expert-badges">
            <rect x={2042} y={1670} width={68} height={69} rx={14} fill={INK} />
            <text
              x={2076}
              y={1704}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={42}
              fontWeight={700}
              fill="#ffffff"
            >
              1
            </text>
            <rect x={2528} y={1670} width={102} height={69} rx={14} fill={PURPLE} />
            <text
              x={2579}
              y={1704}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={36}
              fontWeight={700}
              fill="#ffffff"
            >
              128
            </text>
            <g fill={INK}>
              <rect x={2153} y={1683} width={14} height={14} />
              <rect x={2191} y={1683} width={14} height={14} />
              <rect x={2229} y={1683} width={14} height={14} />
            </g>
          </g>

          <g data-element="moe-router">
            <rect
              x={2094}
              y={1907}
              width={201}
              height={104}
              rx={18}
              fill={PANEL_GRAY}
              stroke={PURPLE}
              strokeWidth={7}
            />
            <text
              x={2194}
              y={1959}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={40}
            >
              Router
            </text>
          </g>

          <g data-element="moe-merge">
            <circle cx={2194} cy={1408} r={40} fill="#ffffff" stroke={INK} strokeWidth={6} />
            <path d="M2172 1408 H2216 M2194 1386 V1430" stroke={INK} strokeWidth={5} />
          </g>
        </g>

        {/* Callouts and annotations. */}
        <g data-element="annotations">
          <text x={1270} y={230} fontSize={52} fontWeight={700}>
            Vocabulary size of <tspan fill={PURPLE}>200k</tspan>
          </text>

          <text x={25} y={1876} fontSize={54} fontWeight={700}>
            YaRN context
          </text>
          <text x={25} y={1934} fontSize={54} fontWeight={700}>
            <tspan fill={PURPLE}>128k</tspan> tokens
          </text>
          <text x={25} y={1992} fontSize={54} fontWeight={700}>
            <tspan fill={PURPLE}>4k</tspan> RoPE base
          </text>

          <text x={1592} y={2408} fontSize={52} fontWeight={700}>
            <tspan fill={PURPLE}>64</tspan> heads
          </text>

          <text x={1365} y={2602} fontSize={53} fontWeight={700}>
            Embedding
          </text>
          <text x={1365} y={2664} fontSize={53} fontWeight={700}>
            dimension of <tspan fill={PURPLE}>2,880</tspan>
          </text>

          <text x={2025} y={1054} fontSize={52} fontWeight={700}>
            Input expert size: <tspan fill={PURPLE}>2,880</tspan>
          </text>
          <text x={2025} y={1138} fontSize={52} fontWeight={700}>
            Intermediate projection size: <tspan fill={PURPLE}>2,880</tspan>
          </text>

          <text x={742} y={2656} fontFamily={MONO} fontSize={38} letterSpacing={6}>
            Sample input text
          </text>
        </g>

        <g data-element="repeat-brace">
          <text x={468} y={1908} fontSize={60} fontWeight={700} fill={PURPLE}>
            36
          </text>
          <text x={558} y={1908} fontSize={60} fontWeight={700} fill={PURPLE}>
            ×
          </text>
          <path
            d="M600 1802 C590 1821 583 1847 589 1866 C593 1879 600 1888 606 1893 C614 1897 622 1902 630 1910 C642 1924 656 1938 690 1936 C674 1928 658 1916 646 1902 C636 1892 626 1884 616 1878 C610 1874 605 1864 603 1848 C601 1834 604 1818 607 1805 Z"
            fill={INK}
          />
        </g>

        <g data-element="resource-savings">
          <text x={1955} y={2252} fontSize={56} fontWeight={700} fill={PURPLE}>
            Resource savings:
          </text>
          <g fill={INK}>
            <circle cx={1962} cy={2312} r={9} />
            <circle cx={1962} cy={2394} r={9} />
            <circle cx={1962} cy={2518} r={9} />
          </g>
          <text x={2015} y={2326} fontSize={52}>
            Model size is <tspan fill={PURPLE} fontWeight={700}>120B</tspan>
          </text>
          <text x={2015} y={2408} fontSize={52}>
            but only <tspan fill={PURPLE} fontWeight={700}>4 experts</tspan> active per
          </text>
          <text x={2015} y={2452} fontSize={52}>
            token
          </text>
          <text x={2015} y={2532} fontSize={52}>
            only <tspan fill={PURPLE} fontWeight={700}>5.1B</tspan> parameters are active
          </text>
          <text x={2015} y={2576} fontSize={52}>
            per inference step
          </text>
        </g>
      </g>
    </svg>
  );
}

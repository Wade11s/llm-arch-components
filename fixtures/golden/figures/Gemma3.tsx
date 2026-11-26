import type { ReactNode } from 'react';
import type { FigureProps } from './types';

const INK = '#000000';
const ORANGE = '#F27200';
const OUTER_FILL = '#D5D5D5';
const BLOCK_FILL = '#DECBA3';
const ATTENTION_FILL = '#5E5E5E';
const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const TITLE_FONT =
  "'Arial Black', 'Avenir Next', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

type NodeBoxProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  children?: ReactNode;
};

function NodeBox({
  x,
  y,
  w,
  h,
  fill = '#FFFFFF',
  stroke = INK,
  strokeWidth = 5,
  rx = 30,
  children,
}: NodeBoxProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {children}
    </g>
  );
}

type LabelProps = {
  x: number;
  y: number;
  size?: number;
  weight?: number;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  children: ReactNode;
};

function Label({
  x,
  y,
  size = 40,
  weight = 500,
  fill = INK,
  anchor = 'middle',
  children,
}: LabelProps) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
    >
      {children}
    </text>
  );
}

type FlowProps = {
  d: string;
  markerId: string;
  arrow?: boolean;
  width?: number;
};

function Flow({ d, markerId, arrow = true, width = 5 }: FlowProps) {
  return (
    <path
      d={d}
      fill="none"
      stroke={INK}
      strokeWidth={width}
      strokeLinecap="round"
      markerEnd={arrow ? `url(#${markerId})` : undefined}
    />
  );
}

type LeaderProps = {
  d: string;
};

function Leader({ d }: LeaderProps) {
  return (
    <path
      d={d}
      fill="none"
      stroke={INK}
      strokeWidth={11}
      strokeDasharray="10 14"
      strokeLinecap="butt"
    />
  );
}

export function Gemma3({ idPrefix }: FigureProps) {
  const arrowId = `${idPrefix}-arrow`;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;
  const cx = 1022;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2593 2686"
      width="2593"
      height="2686"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      fontFamily={FONT_STACK}
      fill={INK}
    >
      <title id={titleId}>Gemma 3 (27B) architecture diagram</title>
      <desc id={descId}>
        Vertical architecture diagram of Gemma 3 (27B). Tokenized text is mapped
        through a 262k-token embedding of width 5,376 into a transformer block
        repeated 62 times. Each block uses pre- and post-RMSNorm pairs around
        grouped-query attention and a feed-forward network, with residual merges
        after each sublayer. Attention uses 32 attention heads, 16 key and value
        heads, a 5:1 local-to-global sliding window, QK-Norm, and RoPE. The
        feed-forward network expands to a 21,504-wide hidden layer through GELU
        activations. Context length is 32k during pretraining and 128k with
        linear RoPE scaling. A final RMSNorm and linear output layer produce the
        vocabulary logits.
      </desc>

      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 30 30"
          markerWidth={30}
          markerHeight={30}
          refX={28}
          refY={15}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M2 2 L28 15 L2 28 Z" fill={INK} />
        </marker>
      </defs>

      <rect width={2593} height={2686} fill="#FFFFFF" />

      <g data-element="title">
        <text
          x={1068}
          y={114}
          fill={ORANGE}
          fontFamily={TITLE_FONT}
          fontSize={120}
          fontWeight={900}
          letterSpacing={-0.5}
          textAnchor="middle"
        >
          Gemma 3 (27B)
        </text>
      </g>

      <g data-element="backbone">
        {/* Model container */}
        <rect
          x={465}
          y={328}
          width={1097}
          height={2053}
          rx={58}
          fill={OUTER_FILL}
          stroke={INK}
          strokeWidth={5}
        />

        <g data-element="repeated-block">
          <rect
            x={641}
            y={675}
            width={778}
            height={1212}
            rx={52}
            fill={BLOCK_FILL}
            stroke={INK}
            strokeWidth={5}
          />

          {/* Residual rails and the central data path */}
          <g data-element="residual-connections">
            <Flow d={`M${cx} 1848 H1265 V1326 H1054`} markerId={arrowId} />
            <Flow d={`M${cx} 1260 H1265 V769 H1054`} markerId={arrowId} />
          </g>

          <g data-element="data-path">
            <Flow d={`M${cx} 2588 V2509`} markerId={arrowId} />
            <Flow d={`M${cx} 2413 V2180`} markerId={arrowId} />
            <Flow d={`M${cx} 2080 V1809`} markerId={arrowId} />
            <Flow d={`M${cx} 1719 V1661`} markerId={arrowId} />
            <Flow d={`M${cx} 1501 V1463`} markerId={arrowId} />
            <Flow d={`M${cx} 1372 V1361`} markerId={arrowId} />
            <Flow d={`M${cx} 1292 V1202`} markerId={arrowId} />
            <Flow d={`M${cx} 1110 V1057`} markerId={arrowId} />
            <Flow d={`M${cx} 965 V921`} markerId={arrowId} />
            <Flow d={`M${cx} 828 V804`} markerId={arrowId} />
            <Flow d={`M${cx} 735 V615`} markerId={arrowId} />
            <Flow d={`M${cx} 523 V474`} markerId={arrowId} />
            <Flow d={`M${cx} 381 V238`} markerId={arrowId} />
          </g>

          <g data-element="attention-block">
            <NodeBox x={807} y={1505} w={430} h={152} fill={ATTENTION_FILL}>
              <Label x={1022} y={1558} size={42} fill="#FFFFFF">
                5:1 (local:global)
              </Label>
              <Label x={1022} y={1600} size={42} fill="#FFFFFF">
                <tspan fill={ORANGE} fontWeight={700}>
                  sliding window
                </tspan>{' '}
                and
              </Label>
              <Label x={1022} y={1642} size={42} fill="#FFFFFF">
                GQA
              </Label>
            </NodeBox>
          </g>

          <g data-element="norm-stack">
            <NodeBox x={848} y={1723} w={348} h={82} stroke={ORANGE} rx={26}>
              <Label x={1022} y={1778}>Pre-RMSNorm 1</Label>
            </NodeBox>

            <NodeBox x={848} y={1376} w={348} h={82} stroke={ORANGE} rx={26}>
              <Label x={1022} y={1431}>Post-RMSNorm 1</Label>
            </NodeBox>

            <NodeBox x={852} y={1114} w={348} h={84} stroke={ORANGE} rx={26}>
              <Label x={1022} y={1170}>Pre-RMSNorm 2</Label>
            </NodeBox>

            <NodeBox x={852} y={832} w={348} h={84} stroke={ORANGE} rx={26}>
              <Label x={1022} y={888}>Post-RMSNorm 2</Label>
            </NodeBox>

          </g>

          <g data-element="feed-forward">
            <NodeBox
              x={848}
              y={969}
              w={350}
              h={84}
              fill={OUTER_FILL}
              stroke="#3A3A3A"
              rx={26}
            >
              <Label x={1023} y={1025}>Feed forward</Label>
            </NodeBox>
          </g>

          <g data-element="residual-merges">
            <circle
              cx={cx}
              cy={1326}
              r={30}
              fill="#FFFFFF"
              stroke={INK}
              strokeWidth={5}
            />
            <path
              d={`M${cx - 15} 1326 H${cx + 15} M${cx} 1311 V1341`}
              stroke={INK}
              strokeWidth={5}
              strokeLinecap="round"
            />
            <circle
              cx={cx}
              cy={769}
              r={30}
              fill="#FFFFFF"
              stroke={INK}
              strokeWidth={5}
            />
            <path
              d={`M${cx - 15} 769 H${cx + 15} M${cx} 754 V784`}
              stroke={INK}
              strokeWidth={5}
              strokeLinecap="round"
            />
          </g>

          <g data-element="repeat-brace">
            <text
              x={478}
              y={1912}
              fill={ORANGE}
              fontSize={58}
              fontWeight={700}
            >
              62
            </text>
            <text
              x={560}
              y={1908}
              fill={ORANGE}
              fontSize={44}
              fontWeight={700}
            >
              ×
            </text>
            <path
              d="M621 1796 C596 1808 592 1824 607 1841 C619 1855 630 1865 632 1874 C633 1878 630 1881 623 1883 C631 1885 635 1890 640 1899 C647 1918 662 1930 678 1936 C690 1941 701 1941 710 1936"
              fill="none"
              stroke={INK}
              strokeWidth={13}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        <g data-element="output-head">
          <NodeBox x={852} y={527} w={348} h={84} rx={26}>
            <Label x={1026} y={583}>Final RMSNorm</Label>
          </NodeBox>
          <NodeBox x={840} y={385} w={372} h={84} rx={30}>
            <Label x={1026} y={440} size={40}>
              Linear output layer
            </Label>
          </NodeBox>
        </g>

        <g data-element="norm-pills">
          <NodeBox x={400} y={1368} w={356} h={80} rx={30}>
            <Label x={578} y={1423} size={38}>QK-Norm</Label>
          </NodeBox>
          <NodeBox x={420} y={1535} w={293} h={84} rx={30}>
            <Label x={566} y={1590} size={38}>RoPE</Label>
          </NodeBox>
          <Flow d="M756 1428 L829 1488" markerId={arrowId} />
          <Flow d="M713 1577 H799" markerId={arrowId} />
        </g>

        <g data-element="embedding">
          <NodeBox x={754} y={2084} w={536} h={92} rx={30}>
            <Label x={1022} y={2142}>Token embedding layer</Label>
          </NodeBox>
        </g>

        <g data-element="input">
          <NodeBox x={847} y={2417} w={350} h={86} rx={30}>
            <Label x={1022} y={2473}>Tokenized text</Label>
          </NodeBox>
          <Label x={cx} y={2646} size={54}>
            Sample input text
          </Label>
        </g>
      </g>

      <g data-element="ffn-inset">
        <rect
          x={1777}
          y={575}
          width={790}
          height={608}
          rx={54}
          fill={OUTER_FILL}
          stroke={INK}
          strokeWidth={10}
          strokeDasharray="12 14"
        />

        <g data-element="ffn-inset-internal">
          <Flow d="M1994 1020 V937" markerId={arrowId} />
          <Flow d="M1994 826 V736" markerId={arrowId} />
          <Flow d="M1994 780 H2157" markerId={arrowId} arrow={false} />
          <Flow d="M2209 780 H2245 V827" markerId={arrowId} arrow={false} />

          <NodeBox x={1828} y={628} w={333} h={104} rx={28}>
            <Label x={1995} y={693} size={40}>
              Linear layer
            </Label>
          </NodeBox>
          <NodeBox x={1828} y={830} w={333} h={103} rx={28}>
            <Label x={1995} y={894} size={40}>
              GELU activation
            </Label>
          </NodeBox>
          <NodeBox x={1828} y={1024} w={333} h={104} rx={28}>
            <Label x={1995} y={1089} size={40}>
              Linear layer
            </Label>
          </NodeBox>
          <NodeBox x={2180} y={831} w={343} h={98} rx={28}>
            <Label x={2352} y={893} size={40}>
              Linear layer
            </Label>
          </NodeBox>

          <circle
            cx={2183}
            cy={780}
            r={27}
            fill={OUTER_FILL}
            stroke={INK}
            strokeWidth={5}
          />
          <path
            d="M2172 769 L2194 791 M2194 769 L2172 791"
            stroke={INK}
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>
      </g>

      <g data-element="leaders">
        <Leader d="M1218 396 L1350 258" />
        <Leader d="M1237 1639 L1882 1889" />
        <Leader d="M1200 1006 L1772 876" />
        <Leader d="M1290 2132 L1598 2244" />
        <Leader d="M320 1845 L420 1624" />
        <Leader d="M2010 1184 V1388" />
      </g>

      <g data-element="callouts">
        <g data-element="vocabulary-callout">
          <Label x={1352} y={254} size={56} weight={700} anchor="start">
            Vocabulary size of <tspan fill={ORANGE}>262k</tspan>
          </Label>
        </g>

        <g data-element="context-callout">
          <Label x={20} y={1893} size={56} weight={700} anchor="start">
            Context length
          </Label>
          <Label x={20} y={1951} size={56} weight={700} anchor="start">
            <tspan fill={ORANGE}>32k</tspan> pretraining
          </Label>
          <Label x={20} y={2009} size={56} weight={700} anchor="start">
            <tspan fill={ORANGE}>128k</tspan> linear RoPE
          </Label>
        </g>

        <g data-element="attention-callout">
          <Label x={1938} y={1905} size={56} weight={700} anchor="start">
            <tspan fill={ORANGE}>32</tspan> attention heads
          </Label>
          <Label x={1938} y={1973} size={56} weight={700} anchor="start">
            <tspan fill={ORANGE}>16</tspan> key &amp; value heads
          </Label>
        </g>

        <g data-element="embedding-callout">
          <Label x={1608} y={2242} size={56} weight={700} anchor="start">
            Embedding
          </Label>
          <Label x={1608} y={2310} size={56} weight={700} anchor="start">
            dimension of <tspan fill={ORANGE}>5,376</tspan>
          </Label>
        </g>

        <g data-element="hidden-callout">
          <Label x={1926} y={1482} size={56} weight={700} anchor="start">
            Hidden layer
          </Label>
          <Label x={1926} y={1544} size={56} weight={700} anchor="start">
            dimension of <tspan fill={ORANGE}>21,504</tspan>
          </Label>
        </g>
      </g>
    </svg>
  );
}

// Generic dot state decoding. Private resource bytes/art stay outside this module.
// The original packed word uses independent bits, not mutually exclusive types.
export function decodeDot(cell) {
  return {present:!!(cell&1),bonus:!!(cell&2),goal:!!(cell&4),initialLowered:!!(cell&0x4000)};
}

// Color-mode selects one bit within each color nibble. Movement uses mode 0.
// Color belongs to the dot's resource permissions; pivot occupancy is irrelevant.
export function dotColorOffset(flags, colorMode=0) {
  if(!Number.isInteger(colorMode)||colorMode<0||colorMode>3)throw new RangeError('colorMode must be 0..3');
  return ((flags&(0x10<<colorMode))?1:0)|((flags&(0x100<<colorMode))?2:0)|((flags&(0x1000<<colorMode))?4:0);
}

// Covers ordinary/bonus forms only. Other mechanics can override this render spec.
// Asset lookup must fail explicitly for unsupported mixed-color private artwork.
export function dotRenderSpec(dot, colorMode=0) {
  const state=decodeDot(dot.cell),color=dotColorOffset(dot.flags??15,colorMode);
  const bonus=state.bonus&&!dot.collected;
  return {present:state.present,bonus,color,assetKey:`${bonus?'bonus':'normal'}:${color}`,
    sourceDescriptor:(bonus?301:309)+color};
}

// Ordinary/bonus or burnt main body. Special animated forms have their own
// runtimes; the qualified uncolored checkpoint outlines equal the plain body.
export function dotBodyFrame(dot,colorMode=0){
 const spec=dotRenderSpec(dot,colorMode);
 return dot.burnt&&!dot.waystation?92+spec.color:dot.transferDeath?108+spec.color:spec.sourceDescriptor-300;
}

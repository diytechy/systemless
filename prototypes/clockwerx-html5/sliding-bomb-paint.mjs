// Source BO/static EX paint helpers. No DOM, assets, collision or simulation.
export const SOURCE_UNIVERSE_CLIP=Object.freeze({x:28,y:28,width:584,height:424});
const frameIn=(atlas,frame)=>atlas?.frames?.find(f=>f.frame===frame);

// Select by requested frame availability, never solely by live burnt state.
export function sourceDotPaint(vector,group,frame){
 for(const atlas of [vector.slowDots,vector.slowWallDots,vector.slowClass4Dots]){const f=atlas?.frames?.find(f=>String(f.group)===String(group)&&f.frame===frame);if(f)return{file:atlas.file,...f};}
 for(const atlas of [String(group)==='4100'?vector.sourceDotShadows:undefined,vector.sourceRingDots?.[group],vector.sourceMarkedDots?.[group],vector.bombDots?.[group],vector.specialDots?.[group]]){const f=frameIn(atlas,frame);if(f)return {file:atlas.file,...f};}
 if(String(group)==='4100'&&frame>=9&&frame<=16){
  const atlas=vector.specialDots?.['4100'],f=frameIn(atlas,79);
  // Raw4100:9..16 and79 share image0 and identical placement. Bonus1..8 do not.
  if(f?.sourceImage===0&&f.x===20&&f.y===20&&f.width===10&&f.height===10)return {file:atlas.file,...f,frame};
 }
 if(String(group)==='300'&&frame>=1&&frame<=16){
  const bonus=frame<9,color=frame-(bonus?1:9),f=vector.dotVariants?.[`${bonus?'bonus':'normal'}:${color}`];
  if(f){if(f.sourceDescriptor!==undefined&&f.sourceDescriptor!==300+frame||f.sourceFrame!==undefined&&f.sourceFrame!==frame)throw new Error('Source dot variant identity mismatch');return {...f,frame,x:f.x+16,y:f.y+15};}
 }
 throw new Error(`Missing required source dot paint ${group}:${frame}`);
}

export function sourceDotLook(dot,special){
 if(special?.main)return {frame:special.main.frame,visible:special.main.visible};
 if(dot.slowdown)return {frame:dot.sourceSlowFrame??189+dot.color,visible:dot.sourceCollidable!==false};
 return {frame:dot.burnt?92+dot.color:dot.transferDeath?108+dot.color:(dot.bonus&&!dot.collected?1:9)+dot.color,visible:dot.sourceCollidable!==false};
}

// Separate source DOmisc TYPE1 atlas. Legacy time-based goal assets are not
// silently reinterpreted as variable original frame rectangles.
export function sourceGoalPaint(vector,frame){
 const size={17:18,18:18,19:16,20:14,21:16,22:18}[frame],atlas=vector.sourceGoalMisc,f=frameIn(atlas,frame),offset=size===18?7:size===16?8:9;
 if(!size||!f||f.sourceFrame!==undefined&&f.sourceFrame!==frame||f.sourceGroup!==undefined&&f.sourceGroup!==300||f.x!==offset||f.y!==offset||f.width!==size||f.height!==size)throw new Error('Required original goal misc17..22 DTO unavailable');
 return {file:atlas.file,...f};
}

export function sourceSparkEraseRect(event,frames){
 const f=frames.find(f=>f.frame===event.descriptorFrame);
 if(!f||![f.x,f.y,f.width,f.height,event.rawBase?.x,event.rawBase?.y].every(Number.isInteger)||event.width!==6||event.height!==6)throw new Error('Original SR descriptor geometry and6x6 erase required');
 return {x:Math.trunc((2*event.rawBase.x+2*f.x+f.width-6)/2),y:Math.trunc((2*event.rawBase.y+2*f.y+f.height-6)/2),width:6,height:6};
}

export function clipSourceUniverse(ctx){const b=SOURCE_UNIVERSE_CLIP;ctx.beginPath();ctx.rect(b.x,b.y,b.width,b.height);ctx.clip();}

// Cache invalidates on journal ARRAY identity: reset retains board and may
// recreate an equal-length journal. Never infer reset solely from op length.
export function createSourceBackground({createCanvas,seed,paint}){
 if(![createCanvas,seed,paint].every(f=>typeof f==='function'))throw new TypeError('Source paint adapters required');
 let layer,context,board,journal,fieldKey,applied=0;
 return {
  draw(round,field,{width=640,height=480}={}){
   if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw new Error('Finite source background canvas size required');
   const ops=round.bombScene?.backgroundPaints??round.sourcePaint?.backgroundPaints,key=JSON.stringify([field,width,height]);
   if(!Array.isArray(ops))throw new Error('Explicit source background journal required');
   if(!layer){layer=createCanvas();context=layer.getContext('2d');}
   if(board!==round.board||journal!==ops||fieldKey!==key||ops.length<applied){
    board=round.board;journal=ops;fieldKey=key;applied=0;layer.width=width;layer.height=height;context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,width,height);context.setTransform(width/640,0,0,height/480,0,0);context.imageSmoothingEnabled=true;
    context.save();clipSourceUniverse(context);context.fillStyle=field.color;context.fillRect(field.x,field.y,field.width,field.height);seed(context,round);context.restore();
   }
   context.save();clipSourceUniverse(context);while(applied<ops.length){paint(context,ops[applied],round,field);applied++;}context.restore();return layer;
  },
  snapshot(){return {applied,initialized:!!layer};}
 };
}

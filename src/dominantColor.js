// Merge nearby color buckets and prefer a central color over a dominant border.
// White and black pixels remain valid garment colors; transparent pixels do not.
export function isStrictWhite(r,g,b) {
  return Math.min(r,g,b) >= 245 && Math.max(r,g,b)-Math.min(r,g,b) <= 6;
}
export function analyzeColors(pixels, width = 0, height = 0) {
  const buckets = new Map();
  let total=0,edgeWeight=0,centerWeight=0;
  for (let i=0;i<pixels.length;i+=4) {
    const alpha=pixels[i+3]/255;
    if (alpha < 0.5) continue;
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
    // The old 240–255 bucket merged cream, light gray and white. Keep only
    // bright neutral pixels together; use finer buckets for other near-whites.
    const nearWhite = Math.min(r,g,b) >= 224;
    const key=isStrictWhite(r,g,b) ? 'white' : nearWhite
      ? `light:${r>>2},${g>>2},${b>>2}`
      : `${r>>4},${g>>4},${b>>4}`;
    const white=isStrictWhite(r,g,b);
    const bucket=buckets.get(key) || {weight:0,r:0,g:0,b:0,white,edge:0,center:0};
    total+=alpha;
    if(width>0 && height>0 && width*height===pixels.length/4){
      const x=(i/4)%width,y=Math.floor((i/4)/width);
      const border=Math.max(1,Math.floor(Math.min(width,height)*0.1));
      const edge=x<border || y<border || x>=width-border || y>=height-border;
      if(edge){edgeWeight+=alpha;bucket.edge+=alpha;}
      else {centerWeight+=alpha;bucket.center+=alpha;}
    }
    bucket.weight+=alpha;bucket.r+=r*alpha;bucket.g+=g*alpha;bucket.b+=b*alpha;
    buckets.set(key,bucket);
  }
  const rgb=bucket=>['r','g','b'].map(channel=>bucket[channel]/bucket.weight);
  const clusters=[];
  for(const bucket of [...buckets.values()].sort((a,b)=>b.weight-a.weight)){
    const color=rgb(bucket);
    // Compare against a fixed seed to avoid chaining distinct shades together.
    const cluster=clusters.find(candidate=>candidate.white===bucket.white && Math.hypot(...color.map((v,i)=>v-candidate.seed[i]))<=24);
    if(cluster){cluster.weight+=bucket.weight;cluster.r+=bucket.r;cluster.g+=bucket.g;cluster.b+=bucket.b;cluster.edge+=bucket.edge;cluster.center+=bucket.center;}
    else clusters.push({...bucket,seed:color});
  }
  const colors=clusters.sort((a,b)=>b.weight-a.weight).slice(0,2).map(cluster=>({
    color:'#'+rgb(cluster).map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''),
    share:cluster.weight/total,white:cluster.white,
    edgeShare:edgeWeight ? cluster.edge/edgeWeight : 0,
    centerShare:centerWeight ? cluster.center/centerWeight : 0,
  }));
  let primary=colors[0],reason='largest-color';
  const largestEdgeShare=edgeWeight ? Math.max(...clusters.map(cluster=>cluster.edge/edgeWeight)) : 0;
  const borderSuspected=primary && edgeWeight>0 && centerWeight>0
    && primary.edgeShare>=largestEdgeShare && primary.edgeShare>=0.5
    && primary.edgeShare-primary.centerShare>=0.1
    && colors[1]?.share>=0.03 && colors[1].centerShare>=0.05
    && colors[1].centerShare-colors[1].edgeShare>=0.05;
  if(borderSuspected){
    reason=primary.white ? 'white-border-suspected' : 'border-color-suspected';
    primary=colors[1];
  }
  return {colors,primary:primary?.color || null,reason:primary?reason:'no-visible-pixels'};
}
export function dominantColorFromPixels(pixels) { return analyzeColors(pixels).primary; }

export function extractColorAnalysis(image) {
  const canvas=document.createElement('canvas');
  const scale=Math.min(1,64/Math.max(image.naturalWidth,image.naturalHeight));
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
  canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context) return {colors:[],primary:null,reason:'canvas-unavailable'};
  context.drawImage(image,0,0,canvas.width,canvas.height);
  return analyzeColors(context.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
}
export function extractDominantColor(image) { return extractColorAnalysis(image).primary; }

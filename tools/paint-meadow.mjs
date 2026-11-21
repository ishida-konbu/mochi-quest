// Original botanical drawings for Mochi Quest. CC0-1.0.
// In a browser, paintMeadowAtlas(document.createElement('canvas')).toBlob(callback, 'image/webp', .94).
export function paintMeadowAtlas(canvas) {
  const tile=192;
  canvas.width=canvas.height=tile*8;
  const c=canvas.getContext('2d');
  let s=1;
  const rnd=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
  const between=(a,b)=>a+(b-a)*rnd();
  const line=(x,y,u,v,width,color,bow=0)=>{
    c.beginPath();c.moveTo(x,y);c.quadraticCurveTo((x+u)/2+bow,(y+v)/2-1,u,v);
    c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();
  };
  const oval=(x,y,rx,ry,angle,color)=>{
    c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fillStyle=color;c.fill();
  };
  // Two faces meet on a curved midrib. Thin blades fold, broad leaves cup the light.
  function leaf(x,y,u,v,width,curve,dark,light) {
    const dx=u-x,dy=v-y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    const mx=x+dx*.54+nx*curve,my=y+dy*.54+ny*curve;
    const rim=(d)=>{c.beginPath();c.moveTo(x,y);
      c.quadraticCurveTo(mx+nx*d,my+ny*d,u,v);c.quadraticCurveTo(mx,my,x,y);c.closePath();};
    rim(width);c.fillStyle=light;c.fill();rim(-width*.87);c.fillStyle=dark;c.fill();
  }
  const greens=[
    ['#607346','#8a9856','#a3ac69'],['#526d4c','#7e945f','#9baa72'],
    ['#7c7a46','#a29155','#bfac71'],['#626f4d','#8d9763','#a4a977'],
    ['#486449','#6e8758','#92a16c'],['#53764d','#83a165','#a0b27b'],
    ['#5e815a','#8aa36c','#a3b884'],['#737847','#929759','#b8ac73'],
    ['#5a754e','#879a65','#a8ad77'],['#687c52','#899a63','#a8b27e'],
    ['#678158','#89a276','#adc08a'],['#697b51','#8ba06b','#a5b682']
  ];
  function rosette(n,top,span,width,pal) {
    for(let k=0;k<n;k++) {
      const t=2*(k+.45)/n-1, x=50+between(-6,6),y=95-between(0,3);
      const tipX=50+t*span+between(-3,3),tipY=96-top*(1-.63*Math.abs(t))+between(-4,4);
      leaf(x,y,tipX,tipY,width*between(.7,1.25),-t*between(5,14),pal[0],pal[k%3?1:2]);
    }
  }
  function floret(x,y,rad,n,pal) {
    for(let k=0;k<n;k++){
      const a=Math.PI*2*k/n;
      oval(x+Math.cos(a)*rad*.59,y+Math.sin(a)*rad*.43,rad*.59,rad*.31,a,pal[k%2]);
    }
    oval(x,y,rad*.33,rad*.27,0,pal[2]);
  }
  function draw(f,g){
    const p=greens[f], spread=.8+g*.055, tall=.82+(g%3)*.085;
    // Botanical plates include young tufts, spreading fans, mature and seeding stems.
    if(f<=3){
      rosette((f===0?14:10)+g*2,(f===0?73:55)*tall,45*spread,f===0?3.4:f===1?5.4:2.9,p);
      if(f===0||f===1)return;
      const n=(f===3?3:4)+g;
      for(let k=0;k<n;k++){
        const t=(k+.5)/n*2-1, x=50+t*24+between(-4,4), y=16+Math.abs(t)*19+between(-5,6);
        line(50+t*4,93,x,y,1.2,p[1],t*4);
        if(f===3){ // Gama: the dark velvet spike and its fine green terminal filament.
          line(x,y+11,x-1,y-3,3.9,g%2?'#896d4e':'#8f7958');
          line(x-1,y-3,x-1.2,y-9,.8,'#af9b78');
        } else { // Susuki: a drooping ivory panicle made of individual spikelets.
          const direction=t>=0?1:-1;
          for(let a=0;a<9;a++) {
            const bx=x+direction*a*.99,by=y-a*.68+a*a*.045;
            line(x,y+9,bx,by+2,.6,'#ae9869',direction*2);
            for(let l=0;l<4;l++){
              const ex=bx+direction*(3+l*.9),ey=by-2+l*1.6;
              leaf(bx,by,ex,ey,1.4,direction*.6,'#c0ac7f','#e1d5ae');
            }
          }
        }
      }return;
    }
    if(f===4){ // Fern: paired pinnae taper along a bending rachis.
      const n=5+g;
      for(let k=0;k<n;k++){
        const t=(k+.5)/n*2-1,dx=t*45,dy=-(73-27*Math.abs(t))*tall;
        const at=u=>[50+dx*(.28*u+.72*u*u),94+dy*u-7*Math.sin(Math.PI*u)];
        const tip=at(1);line(50,94,...tip,1.15,p[1],-t*8);
        for(let j=1;j<=10;j++){
          const u=j/11,[x,y]=at(u),size=2+7.2*Math.sin(Math.PI*u);
          for(const sign of [-1,1])leaf(x,y,x+sign*size+t*2,y-size*.53,2.9*(1-u*.6),sign*1.4,p[0],p[(j+k)%3?1:2]);
        }
      }return;
    }
    if(f===5||f===6){ // Fuki has shield-shaped veined leaves; clover has three rounded leaflets.
      const n=(f===5?5:10)+g;
      for(let k=0;k<n;k++){
        const a=between(0,Math.PI*2),r=between(8,32)*spread,x=50+Math.cos(a)*r,
          y=(f===5?41:45)+Math.sin(a)*16+between(-4,8);
        line(50+(x-50)*.13,94,x,y,1.4,p[0],(x-50)*.15);
        if(f===5){
          const w=between(9,16),h=between(5,10);
          c.beginPath();c.moveTo(x,y+2);
          for(let j=0;j<=24;j++){
            const theta=-Math.PI*.39+j/24*Math.PI*1.83, edge=j%2?.86:1;
            c.lineTo(x+Math.sin(theta)*w*edge,y-Math.cos(theta)*h*edge);
          }c.closePath();c.fillStyle=p[k%2?1:0];c.fill();
          for(let j=-2;j<=2;j++)line(x,y+2,x+j*w*.42,y-h*(1-Math.abs(j)*.19),.54,p[2]);
        }else{
          for(let j=0;j<3;j++){
            const b=a+j*Math.PI*2/3,r=4.2;
            oval(x+Math.cos(b)*r,y+Math.sin(b)*r,r*1.32,r*.85,b,p[(k+j)%3?1:0]);
            line(x+Math.cos(b)*2,y+Math.sin(b)*2,x+Math.cos(b)*5,y+Math.sin(b)*5,.63,p[2]);
          }
          if(g>=2 && k%4===0)floret(x,y-5,3.2,7,['#d5bec4','#e5d3cd','#dec7a5']);
        }
      }return;
    }
    if(f===11){ // Horsetail: jointed shoots with whorls of fine radial branchlets.
      for(let k=0;k<5+g;k++){
        const x=between(21,81),y=between(18,56);
        line(49+(x-49)*.45,94,x,y,1.8,p[1]);
        for(let j=1;j<=6;j++){
          const u=j/7,cx=x+(49+(x-49)*.45-x)*u,cy=y+(94-y)*u;
          for(let d=-2;d<=2;d++)line(cx,cy,cx+d*(2.1+u*3),cy-4-u*6+Math.abs(d),.85,p[d%2?0:1],d*.6);
          oval(cx,cy,1.3,.65,0,'#6b6545');
        }oval(x,y,1.8,4.4,.08,'#ae9368');
      }return;
    }
    const flowerColors={7:['#daae54','#eaca74','#85693b'],8:['#9184b0','#b9a9ce','#dfbf7c'],
      9:['#e2d5cc','#f0e8de','#d3a14f'],10:['#ceb5c8','#e8cfd7','#c19a67']};
    rosette(5+g,39,37, f===10?7:4,p);
    const n=3+g;
    for(let k=0;k<n;k++){
      const t=(k+.5)/n*2-1,x=50+t*34+between(-3,3),y=19+Math.abs(t)*23+between(-3,9);
      line(50+t*6,92,x,y,1.35,p[0],t*3);
      for(let j=1;j<4;j++){
        const u=j/4,cx=x+(50+t*6-x)*u,cy=y+(92-y)*u,d=(k+j)%2?1:-1;
        leaf(cx,cy,cx+d*(6+u*9),cy-(7+u*5),3+u,d*2,p[0],p[1]);
      }
      if(f===7){ // Goldenrod carries tiered sprays, rather than a single round flower.
        for(let j=0;j<5;j++)for(const d of [-1,1]){
          const dx=d*(j+1)*1.65;line(x,y+j*2.4,x+dx,y+j*2.4-2,.65,p[1]);
          floret(x+dx,y+j*2.4-2,1.6,4,flowerColors[7]);
        }
      }else if(f===8){ // Nodding purple bell.
        line(x,y,x+2.8,y-1,.8,p[1]);
        c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+5,y-2,x+4,y+7,x+7,y+8);
        c.lineTo(x+4,y+7);c.lineTo(x+2,y+9);c.lineTo(x,y+7);c.lineTo(x-2,y+8);
        c.quadraticCurveTo(x+1,y+3,x,y);c.fillStyle=flowerColors[8][k%2];c.fill();
      }else floret(x,y,f===9?4.5:5.2,f===9?10:5,flowerColors[f]);
    }
  }
  for(let f=0;f<12;f++)for(let g=0;g<5;g++){
    const i=f*5+g;s=91237+i*21707;
    c.save();c.translate(i%8*tile,Math.floor(i/8)*tile);
    c.scale(tile/100,tile/100);draw(f,g);c.restore();
  }
  return canvas;
}

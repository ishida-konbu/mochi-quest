// Original botanical drawings for Mochi Quest. CC0-1.0.
// In a browser, paintMeadowAtlas(document.createElement('canvas')).toBlob(callback, 'image/webp', .94).
import { HERBS, HERB_FORMS, HERB_ATLAS_SIDE } from '../two/meadow-herbs.js';

export function paintMeadowAtlas(canvas) {
  const tile=192;
  canvas.width=canvas.height=tile*HERB_ATLAS_SIDE;
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
  const ink='#4e5042';
  // Two faces meet on a curved midrib. Thin blades fold, broad leaves cup the light.
  function leaf(x,y,u,v,width,curve,dark,light) {
    const dx=u-x,dy=v-y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    const mx=x+dx*.54+nx*curve,my=y+dy*.54+ny*curve;
    const rim=(d)=>{c.beginPath();c.moveTo(x,y);
      c.quadraticCurveTo(mx+nx*d,my+ny*d,u,v);c.quadraticCurveTo(mx,my,x,y);c.closePath();};
    rim(width);c.fillStyle=light;c.fill();rim(-width*.87);c.fillStyle=dark;c.fill();
    if(width>2.7){
      // A loaded edge at the heel breaks into a fine, dry midrib towards the tip.
      const t=.74,midX=mx-nx*width*.78,midY=my-ny*width*.78;
      const endX=(1-t)**2*x+2*(1-t)*t*midX+t*t*u,endY=(1-t)**2*y+2*(1-t)*t*midY+t*t*v;
      c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+(midX-x)*t,y+(midY-y)*t,endX,endY);
      c.strokeStyle='#48503ec4';c.lineWidth=Math.min(1.1,width*.15);c.stroke();
      if(width>5){
        c.beginPath();c.moveTo(x*.25+u*.75,y*.25+v*.75);c.lineTo(u,v);
        c.strokeStyle='#51563fa1';c.lineWidth=.42;c.stroke();
      }
    }
  }
  const greens=[
    ['#607346','#8a9856','#a3ac69'],['#526d4c','#7e945f','#9baa72'],
    ['#7c7a46','#a29155','#bfac71'],['#626f4d','#8d9763','#a4a977'],
    ['#486449','#6e8758','#92a16c'],['#53764d','#83a165','#a0b27b'],
    ['#5e815a','#8aa36c','#a3b884'],['#737847','#929759','#b8ac73'],
    ['#5a754e','#879a65','#a8ad77'],['#687c52','#899a63','#a8b27e'],
    ['#678158','#89a276','#adc08a'],['#697b51','#8ba06b','#a5b682'],
    ['#495d48','#758367','#9aa185'],['#596448','#8d9068','#aea478'],
    ['#536c53','#83966e','#a3ae84'],['#626c50','#859273','#a4a88a'],
    ['#596f63','#829888','#a6ae95'],['#55684c','#879668','#b1b28b'],
    ['#626f54','#93a17e','#b3b994'],['#526d60','#829987','#a6b29a']
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
        c.beginPath();c.moveTo(50,94);
        for(let j=1;j<=10;j++)c.lineTo(...at(j/10));
        c.lineWidth=1.15;c.strokeStyle=p[1];c.stroke();
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
    if(f===12){ // Sasa: jointed culms end in a fan of long, veined blades.
      for(let k=0;k<3+g;k++){
        const t=(k+.5)/(3+g)*2-1,u=50+t*32+between(-4,4),v=between(17,45)+10*Math.abs(t);
        line(50+t*5,94,u,v,1.45,ink,-t*4);
        for(let j=0;j<3;j++){
          const a=.12+j*.24,x=u+(50+t*5-u)*a,y=v+(94-v)*a,side=(k+j)%2?1:-1;
          line(x-1,y+.7,x+1.2,y-.5,.8,p[2]);
          for(let l=0;l<2;l++){
            const tipX=x+side*(8+5*l+between(0,5)),tipY=y-13+l*12+between(-3,3);
            leaf(x,y,tipX,tipY,4.6-l*.8,side*1.7,p[0],p[(k+l)%2+1]);
          }
        }
      }return;
    }
    if(f===13){ // Zenmai: russet coils unfurl above successive pairs of pinnae.
      for(let k=0;k<4+g;k++){
        const t=(k+.5)/(4+g)*2-1, x=50+t*33, y=between(23,54)+10*Math.abs(t),dir=k%2?1:-1;
        const r=between(3.0,5.0),cx=x+r*dir;
        line(49+t*8,94,x,y,2.15,k%2?p[0]:'#837257',-t*5);
        c.beginPath();c.moveTo(x,y);
        for(let j=0;j<=38;j++){
          const a=j*.19,rr=r*(1-j/44);
          c.lineTo(cx-dir*Math.cos(a)*rr,y-Math.sin(a)*rr);
        }
        c.strokeStyle='#705c47';c.lineWidth=2.25;c.stroke();c.strokeStyle='#b19e75';c.lineWidth=.9;c.stroke();
        for(let j=1;j<5;j++){
          const a=j/6,bx=x+(49+t*8-x)*a,by=y+(94-y)*a;
          if(k%3===0&&g<3)continue;
          for(const side of [-1,1])leaf(bx,by,bx+side*(3+a*9),by-3-a*6,2.7,side*.7,p[0],p[1]);
        }
      }return;
    }
    if(f===14){ // Omodaka: two backward-facing lobes and a long central spear.
      for(let k=0;k<4+g;k++){
        const t=(k+.5)/(4+g)*2-1,x=50+t*29,y=between(39,62),w=between(4,8),h=between(12,22);
        line(48+t*8,95,x,y,1.7,p[0],t*4);
        c.save();c.translate(x,y);c.rotate(t*.45);
        c.beginPath();c.moveTo(0,-h);c.quadraticCurveTo(w*.65,-h*.28,w*1.20,h*.55);
        c.quadraticCurveTo(w*.34,h*.40,0,1);c.quadraticCurveTo(-w*.43,h*.47,-w*1.4,h*.62);
        c.quadraticCurveTo(-w*.57,-h*.1,0,-h);c.fillStyle=p[k%2];c.fill();
        line(0,1,0,-h+.8,.72,p[2]);line(0,1,-w*1.25,h*.52,.64,ink);c.restore();
      }
      if(g>=2){
        const x=53+g*1.6;line(52,94,x,23,1.4,p[0]);
        for(let j=0;j<3;j++){
          const y=20+j*8,u=x+(j%2?5:-4);
          line(x,y+6,u,y,1,p[1]);floret(u,y,3.9,3,['#ece8d9','#dddac8','#bda562']);
        }
      }return;
    }
    if(f===15){ // Hagi: arching branches with three rounded leaflets and pea flowers.
      for(let k=0;k<4+g;k++){
        const t=(k+.5)/(4+g)*2-1,dx=t*43,h=59-20*Math.abs(t)+between(-6,10);
        const point=a=>[50+dx*(.55*a+.45*a*a),94-h*a-19*Math.sin(Math.PI*a)];
        c.beginPath();c.moveTo(50,94);
        for(let j=1;j<=12;j++)c.lineTo(...point(j/12));
        c.lineWidth=1.45;c.strokeStyle='#74664e';c.stroke();
        for(let j=1;j<=6;j++){
          const a=(j+.1)/7,[x,y]=point(a),d=j%2?1:-1;
          const u=x+d*(3+a*3),v=y-2;
          line(x,y,u,v,.69,ink);
          for(let l=-1;l<=1;l++)oval(u+l*2.4,v-2.1+Math.abs(l)*1.35,3.0,1.65,-1.45+l*.90,p[(k+j+l+1)%3?1:0]);
          if(j<3||g===0)continue;
          for(let l=0;l<3;l++){
            const bx=x-d*(2+l*1.2),by=y+.8+l*1.7;
            oval(bx,by,1.7,1.2,d*.8,'#94677b');oval(bx+d*.7,by-.8,1.4,.9,d*.7,'#ce9ba9');
          }
        }
      }return;
    }
    if(f===16){ // Kikyo: pointed, fused petals open out of five-ribbed buds.
      for(let k=0;k<3+g;k++){
        const t=(k+.5)/(3+g)*2-1,x=50+t*31+between(-4,4),y=between(18,41)+Math.abs(t)*10;
        line(49+t*6,94,x,y,1.45,p[0],-t*3);
        for(let j=1;j<=3;j++){
          const a=j*.23,bx=x+(49+t*6-x)*a,by=y+(94-y)*a,side=(k+j)%2?1:-1;
          leaf(bx,by,bx+side*(7+a*5),by-7,3.8,side*1.4,p[0],p[1]);
        }
        if((k+g)%4===0){oval(x,y,2.8,4.0,.1,'#89839c');line(x,y-3,x,y+3,.6,'#696779');continue;}
        c.beginPath();const rad=between(4.4,6.7);
        for(let j=0;j<=10;j++){
          const a=-1.52+j*Math.PI/5,r=j%2?rad*.45:rad;
          const u=x+Math.cos(a)*r,v=y+Math.sin(a)*r*.90;
          if(j)c.lineTo(u,v);else c.moveTo(u,v);
        }
        c.closePath();c.fillStyle=k%2?'#9791b1':'#a9a3bf';c.fill();
        c.strokeStyle='#67667f';c.lineWidth=.67;c.stroke();
        for(let j=0;j<5;j++){
          const a=-1.52+j*Math.PI*2/5;line(x,y,x+Math.cos(a)*rad*.77,y+Math.sin(a)*rad*.69,.6,'#75718c');
        }oval(x,y,1.25,.91,0,'#ded4ab');
      }return;
    }
    if(f===17){ // Oobako: pleated rosette and narrow seed candles.
      for(let k=0;k<7+g;k++){
        const t=(k+.5)/(7+g)*2-1,x=50+t*43,y=74-14*(1-Math.abs(t))+between(-4,6);
        const w=between(6,10),bend=-t*5;
        leaf(50,93,x,y,w,bend,p[0],p[k%2+1]);
        for(const side of [-1,0,1])line(50,92,x,y,.55,p[2],bend+side*w*.37);
      }
      for(let k=0;k<2+g;k++){
        const x=between(30,69),y=between(22,56);
        line(50,93,x,y,1.06,p[0]);
        for(let j=0;j<6;j++)oval(x+(j%2-.5)*.9,y-j*1.7,1.25,1.58,.15,'#877e61');
      }return;
    }
    if(f===18){ // Nazuna: triangular seed purses, with white petals at the tip.
      rosette(6+g,28,39,4.0,p);
      for(let k=0;k<3+g;k++){
        const t=(k+.5)/(3+g)*2-1,x=50+t*28,y=between(16,40)+Math.abs(t)*9;
        line(50+t*4,93,x,y,1.22,p[0],-t*2);
        for(let j=1;j<=5;j++){
          const a=.09*j,bx=x+(50+t*4-x)*a,by=y+(93-y)*a,d=j%2?1:-1,u=bx+d*(3+a*8),v=by-3;
          line(bx,by,u,v,.62,p[0]);
          c.beginPath();c.moveTo(u,v+.6);c.lineTo(u-1.8,v-2.7);c.quadraticCurveTo(u-1,v-4.1,u,v-2.7);
          c.quadraticCurveTo(u+1.5,v-4.2,u+2,v-2.6);c.closePath();c.fillStyle=p[1];c.fill();
        }
        for(let j=0;j<4;j++)floret(x+between(-2.1,2.1),y+between(-3,1),1.65,4,['#e9e6d8','#dcdccd','#c6ad78']);
      }return;
    }
    if(f===19){ // Hamahirugao: beach runners, fleshy kidney leaves and pleated trumpets.
      for(let k=0;k<4+g;k++){
        const t=(k+.5)/(4+g)*2-1,x=50+t*37,y=between(48,69);
        const runner=a=>[50+(x-50)*a+t*13*a*(1-a),94+(y-94)*a+3*Math.sin(a*Math.PI*2)];
        c.beginPath();c.moveTo(50,94);
        for(let j=1;j<=12;j++)c.lineTo(...runner(j/12));
        c.lineWidth=1.35;c.strokeStyle='#746f55';c.stroke();
        for(let j=1;j<=4;j++){
          const [u,v]=runner(j/4),d=(j+k)%2?1:-1;
          oval(u+d*2.2,v-2.6,4.6,3.0,d*.55,p[(k+j)%2]);
          oval(u+d*5.3,v-1.8,3.7,2.8,-d*.46,p[1]);line(u,v,u+d*6.3,v-2.6,.64,p[2]);
        }
        if((k+g)%3===0)continue;
        const r=between(4.8,7.0);
        c.beginPath();c.moveTo(x-1,y+7);c.quadraticCurveTo(x-r*.33,y+2,x-r,y);
        c.lineTo(x+r,y);c.quadraticCurveTo(x+r*.35,y+3,x+1,y+7);
        c.closePath();c.fillStyle='#b17f8c';c.fill();
        oval(x,y,r,r*.56,-t*.15,'#ddbac1');
        for(let j=0;j<5;j++){
          const a=j*Math.PI*2/5;line(x,y+.5,x+Math.cos(a)*r*.86,y+Math.sin(a)*r*.47,.54,'#b18a9a');
        }oval(x,y+.3,1.3,.8,0,'#efe2c5');
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
  for(let f=0;f<HERBS.length;f++)for(let g=0;g<HERB_FORMS;g++){
    const i=f*HERB_FORMS+g;s=91237+i*21707;
    c.save();c.translate(i%HERB_ATLAS_SIDE*tile,Math.floor(i/HERB_ATLAS_SIDE)*tile);
    // Leave a transparent gutter; the root rests just above the bottom of the plate.
    c.beginPath();c.rect(2,2,tile-4,tile-4);c.clip();c.scale(tile/100,tile/100);
    c.translate(50,98);c.transform(.88+g*.018,0,(g-2)*.052,.91+(g%3)*.031,0,0);
    c.translate(-50,-95);draw(f,g);c.restore();
  }
  return canvas;
}

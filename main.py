"""星辰音疗 — 3D 星座探索 · 拖拽旋转 · 温暖音景"""
import pygame, math, random, struct, sys, time

pygame.init()
pygame.mixer.init(frequency=22050, size=-16, channels=12, buffer=512)

W, H = 1200, 800
screen = pygame.display.set_mode((W, H), pygame.RESIZABLE)
pygame.display.set_caption("星辰音疗 · 3D 星座物语")
clock = pygame.time.Clock()

def _font(sz, bold=False):
    for n in ["simhei","microsoftyahei","msyh","fangsong","simsun"]:
        try:
            f = pygame.font.SysFont(n, sz, bold=bold)
            if f.render("测", True, (255,)*3).get_width(): return f
        except: pass
    return pygame.font.Font(None, sz)

F_TITLE=_font(48,1); F_NAME=_font(26); F_BODY=_font(20)
F_SMALL=_font(15); F_TINY=_font(12); F_SNAME=_font(22,1)
GLOW=(130,190,255); SR=22050

# ═══════════════════════ AUDIO ENGINE ═══════════════════════
# warm ambient synthesis with built-in reverb

def _tri(t, f):
    """triangle wave (warmer than sine)"""
    p = (t * f) % 1.0
    return 2.0 * abs(2.0 * p - 1.0) - 1.0

def _sine(t, f):
    return math.sin(2 * math.pi * f * t)

def _soft_clip(v, threshold=0.6):
    """soft saturation for warmth"""
    if v > threshold:
        return threshold + (v - threshold) / (1 + ((v - threshold) / (1 - threshold)) ** 2)
    if v < -threshold:
        return -threshold - (v + threshold) / (1 + ((-v - threshold) / (1 - threshold)) ** 2)
    return v

def _reverb(samples, sr, delays=[0.06, 0.11, 0.17, 0.23], decays=[0.25, 0.18, 0.12, 0.07]):
    """add multi-tap reverb tail to sample array"""
    nframes = len(samples) // 4
    out = bytearray(nframes * 4)
    for i in range(nframes):
        idx = i * 4
        out[idx] = samples[idx]
        out[idx+1] = samples[idx+1]
        out[idx+2] = samples[idx+2]
        out[idx+3] = samples[idx+3]
    for delay_s, dec in zip(delays, decays):
        d = int(sr * delay_s)
        if d >= nframes: continue
        for i in range(nframes - d):
            src_i = i * 4
            dst_i = (i + d) * 4
            v = struct.unpack_from('<h', samples, src_i)[0]
            w = struct.unpack_from('<h', out, dst_i)[0]
            w += int(v * dec)
            w = max(-32768, min(32767, w))
            struct.pack_into('<h', out, dst_i, w)
            struct.pack_into('<h', out, dst_i + 2, w)
    return bytes(out)

def _gen_pad(freqs, dur=6.0, vol=0.035, sr=SR):
    """warm evolving pad with multiple detuned layers"""
    n = int(sr * dur)
    tail = int(sr * 1.0)
    buf = bytearray()
    # Each frame: mix multiple oscillators with slow modulation
    for i in range(n):
        t = i / sr
        # envelope - very slow attack, long release
        attack = min(i / max(int(sr * 1.5), 1), 1.0)
        release = max(1.0 - max(i - (n - tail), 0) / tail, 0.0)
        env = attack * release
        v = 0.0
        for fi, freq in enumerate(freqs):
            # three detuned layers per frequency
            v += _tri(t, freq) * 0.5
            v += _tri(t, freq * 1.007) * 0.25
            v += _tri(t, freq * 0.997) * 0.15
            # sub octave
            v += _tri(t, freq * 0.5) * 0.2
            # slow amplitude modulation
            mod = 0.8 + 0.2 * math.sin(t * 0.15 + fi * 1.7)
            v *= mod
        v = _soft_clip(v, 0.7)
        v = int(vol * 28000 * v / len(freqs) * env)
        v = max(-32768, min(32767, v))
        buf += struct.pack('<hh', v, v)
    buf = _reverb(buf, sr)
    return pygame.mixer.Sound(buffer=buf)

def _gen_tone(freq, dur=3.0, vol=0.05, sr=SR):
    """warm melodic tone — triangle + sine blend with reverb"""
    n = int(sr * dur)
    tail = int(sr * 0.5)
    buf = bytearray()
    for i in range(n):
        t = i / sr
        attack = min(i / max(int(sr * 0.4), 1), 1.0)
        release = max(1.0 - max(i - (n - tail), 0) / tail, 0.0)
        env = attack * release
        v = _tri(t, freq) * 0.6 + _sine(t, freq) * 0.4
        v += _tri(t, freq * 1.005) * 0.2
        v += _tri(t, freq * 0.5) * 0.15
        v = _soft_clip(v, 0.7)
        v = int(vol * 28000 * v * env)
        v = max(-32768, min(32767, v))
        buf += struct.pack('<hh', v, v)
    buf = _reverb(buf, sr, decays=[0.2, 0.12, 0.06])
    return pygame.mixer.Sound(buffer=buf)

def _gen_drone(freqs, dur=8.0, vol=0.018, sr=SR):
    """deep, subby drone — barely audible, foundation layer"""
    n = int(sr * dur)
    tail = int(sr * 1.5)
    buf = bytearray()
    for i in range(n):
        t = i / sr
        attack = min(i / max(int(sr * 2.0), 1), 1.0)
        release = max(1.0 - max(i - (n - tail), 0) / tail, 0.0)
        env = attack * release
        v = 0.0
        for freq in freqs:
            v += _tri(t, freq) * 0.4
            v += _tri(t, freq * 2.01) * 0.2
            v += _sine(t, freq * 0.5) * 0.3
        v = _soft_clip(v, 0.5)
        v = int(vol * 28000 * v / len(freqs) * env)
        v = max(-32768, min(32767, v))
        buf += struct.pack('<hh', v, v)
    buf = _reverb(buf, sr, decays=[0.15, 0.1, 0.05])
    return pygame.mixer.Sound(buffer=buf)

def _gen_chord(freqs, dur=4.0, vol=0.03, sr=SR):
    """soft breathy chord"""
    n = int(sr * dur)
    tail = int(sr * 0.8)
    buf = bytearray()
    for i in range(n):
        t = i / sr
        attack = min(i / max(int(sr * 0.6), 1), 1.0)
        release = max(1.0 - max(i - (n - tail), 0) / tail, 0.0)
        env = attack * release
        v = 0.0
        for freq in freqs:
            v += _tri(t, freq) * 0.5
            v += _sine(t, freq) * 0.5
            v += _tri(t, freq * 1.006) * 0.15
        v = _soft_clip(v, 0.6)
        v = int(vol * 28000 * v / len(freqs) * env)
        v = max(-32768, min(32767, v))
        buf += struct.pack('<hh', v, v)
    buf = _reverb(buf, sr, decays=[0.22, 0.15, 0.08, 0.04])
    return pygame.mixer.Sound(buffer=buf)

# pentatonic scales (always sound good together)
PENTA = [
    [261.63,293.66,329.63,392.00,440.00,523.25,587.33],
    [196.00,220.00,246.94,293.66,329.63,392.00,440.00],
    [146.83,164.81,196.00,220.00,261.63,293.66,329.63],
    [174.61,196.00,220.00,261.63,293.66,349.23,392.00],
    [233.08,261.63,293.66,349.23,392.00,466.16,523.25],
]
DRONES = [65.41,49.00,73.42,87.31,58.27]  # C2,G1,D2,F2,Bb1

cache = {}
def _get(typ, ci, si=None):
    k = (typ, ci, si)
    if k in cache: return cache[k]
    if typ == 'drone':
        s = _gen_drone([DRONES[ci], DRONES[ci]*3], 8.0, 0.015)
    elif typ == 'note':
        s = _gen_tone(PENTA[ci][si % len(PENTA[ci])], 3.0, 0.04)
    elif typ == 'chord':
        s = _gen_chord([PENTA[ci][0], PENTA[ci][2], PENTA[ci][4]], 4.0, 0.03)
    elif typ == 'comp':
        s = _gen_chord([PENTA[ci][0], PENTA[ci][2], PENTA[ci][4], PENTA[ci][1]], 7.0, 0.045)
    elif typ == 'click':
        s = _gen_tone(1200, 0.06, 0.02)
    elif typ == 'miss':
        s = _gen_tone(300, 0.2, 0.015)
    else:
        return None
    cache[k] = s
    return s

def play(typ, ci, si=None, loops=-1, fade=1500):
    s = _get(typ, ci, si)
    if s:
        ch = pygame.mixer.find_channel()
        if ch: ch.play(s, loops=loops, fade_ms=fade)

def stop_all(fade=500):
    for i in range(pygame.mixer.get_num_channels()):
        pygame.mixer.Channel(i).fadeout(fade)

# ═══════════════════════ 3D ═══════════════════════
FOV=600; CAM_DIST=800

class Vec3:
    __slots__ = ('x','y','z')
    def __init__(self, x, y, z): self.x=x;self.y=y;self.z=z
    def ry(self, a):
        c = math.cos(a); s = math.sin(a)
        return Vec3(self.x*c - self.z*s, self.y, self.x*s + self.z*c)

def proj(v, sw, sh):
    cz = v.z + CAM_DIST
    if cz <= 10: return None
    f = FOV / cz
    return (v.x * f + sw/2, -v.y * f + sh/2, max(f * 0.8, 0.1))

# ═══════════════════════ DATA ═══════════════════════
C_DATA = [
 {"name":"北斗七星","intro":"北斗七星是中国古代天文中最重要的星群之一。",
  "stars":[
   (0,60,-40,"天枢 (Dubhe)","距地球124光年。","北斗为天帝的马车。"),
   (60,45,-25,"天璇 (Merak)","距地球80光年。","「璇」是美玉，象征高洁。"),
   (120,20,-10,"天玑 (Phecda)","距地球84光年。","道教尊为「禄星」。"),
   (170,-10,5,"天权 (Megrez)","北斗最暗之星。","「权衡」一词源于此。"),
   (210,-50,20,"玉衡 (Alioth)","北斗最亮之星。","道教中为「寿星」。"),
   (255,-90,40,"开阳 (Mizar)","肉眼可见双星。","「辅车相依」源于此。"),
   (310,-130,60,"摇光 (Alkaid)","即「破军星」。","象征变革。")],
  "edges":[(0,1),(1,2),(2,3),(3,4),(4,5),(5,6)]},
 {"name":"猎户座","intro":"猎户座是夜空中最易辨认的星座之一。",
  "stars":[
   (-50,80,40,"参宿四 (Betelgeuse)","猎户右肩，红超巨星。","古希腊传说中是猎人肩膀。"),
   (20,60,25,"参宿五 (Bellatrix)","猎户左肩。","古埃及与金字塔对齐。"),
   (70,15,-5,"参宿一 (Alnitak)","腰带三星之一。","二十八宿之一。"),
   (110,-15,-20,"参宿二 (Alnilam)","腰带三星之一。","古埃及的灵魂阶梯。"),
   (160,15,-5,"参宿三 (Mintaka)","腰带三星之一。","实际光度极高。"),
   (210,60,25,"参宿七 (Rigel)","猎户座最亮星。","「巨人之足」。"),
   (260,80,40,"伐三 (Saiph)","猎户左脚。","「巨人之剑」。")],
  "edges":[(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(0,2),(4,6)]},
 {"name":"天琴座","intro":"天琴座包含夜空中最亮的星之一——织女星。",
  "stars":[
   (80,80,30,"织女一 (Vega)","天琴最亮，距地球25光年。","牛郎织女传说。"),
   (130,30,10,"织女二 (ε Lyrae)","美丽的双星系统。","寓意成双成对。"),
   (-10,50,-15,"渐台一 (β Lyrae)","奇特的食变星。","意为渐起的台基。"),
   (170,-30,-25,"辇道增七 (Albireo)","金蓝双星。","美丽的名字误会。"),
   (-50,-30,-40,"天琴座R (R Lyrae)","周期46天的脉动变星。","即使波动也在发光。")],
  "edges":[(0,1),(1,3),(0,2),(2,4)]},
 {"name":"天鹅座","intro":"天鹅座横跨银河，姿态如展翅翱翔的天鹅。",
  "stars":[
   (0,110,50,"天津四 (Deneb)","天鹅座最亮星。","与牛郎织女构成夏季大三角。"),
   (50,60,25,"天鹅座γ (Sadr)","天鹅胸口。","天体摄影热门目标。"),
   (120,15,-5,"天津一 (δ Cygni)","多重星系统。","曾用于航海导航。"),
   (190,-25,-25,"天津二 (ε Cygni)","天鹅翅尖。","拥有行星系统。"),
   (260,-40,-35,"天津三 (ζ Cygni)","天鹅翅尖。","古波斯视天鹅为神鸟。"),
   (85,-30,-15,"天鹅座R (χ Cygni)","米拉变星。","变星教会我们接受变化。"),
   (160,-80,-40,"辇道增七 (Albireo)","天鹅头部双星。","源自翻译误读。")],
  "edges":[(0,1),(1,2),(2,3),(2,5),(5,6),(3,4)]},
 {"name":"小熊座","intro":"小熊座拥有夜空中最重要的星——北极星。",
  "stars":[
   (0,80,40,"北极星 (Polaris)","距地球430光年。","孔子：譬如北辰。"),
   (45,40,15,"帝星 (Kochab)","曾是北极星。","代表帝王。"),
   (85,0,-5,"太子 (Pherkad)","北极守护者。","位于紫微垣。"),
   (150,-15,-25,"勾陈增九 (ζ UMi)","A型白色星。","紫微垣的后宫。"),
   (200,-40,-35,"少尉 (η UMi)","距地球97光年。","紫微垣的武将。"),
   (170,-80,-40,"上辅 (θ UMi)","K型橙色星。","辅佐帝王之臣。"),
   (110,-65,-25,"少辅 (δ UMi)","「Yildun」意为星。","次一级辅臣。")],
  "edges":[(0,1),(1,2),(2,3),(3,4),(4,5),(5,6)]},
]

# ═══════════════════════ BG ═══════════════════════
class Star3D:
    def __init__(self):
        self.v=Vec3(random.uniform(-3000,3000),random.uniform(-2000,2000),random.uniform(200,5000))
        self.r=random.uniform(0.3,2); self.ph=random.uniform(0,6.28)
    def draw(self,surf,rot,w,h):
        rv=self.v.ry(rot); cz=rv.z+CAM_DIST
        if cz<=10: return
        f=FOV/cz; sx=rv.x*f+w/2; sy=-rv.y*f+h/2
        if sx<-100 or sx>w+100 or sy<-100 or sy>h+100: return
        d=min(1,cz/5000); v=0.3+0.7*(0.5+0.5*math.sin(self.ph))
        br=v*(0.3+0.7*(1-d)); r=self.r*(0.5+0.5*(1-d))
        a=int(br*180)
        s=pygame.Surface((int(r*6),int(r*6)),pygame.SRCALPHA)
        c=(int(180*br),int(200*br),255,a)
        pygame.draw.circle(s,c,(int(r*3),int(r*3)),r)
        surf.blit(s,(sx-r*3,sy-r*3),special_flags=pygame.BLEND_ADD)

class Nebula:
    def __init__(self):
        self.v=Vec3(random.uniform(-2000,2000),random.uniform(-1500,1500),random.uniform(500,4000))
        self.r=random.uniform(200,500)
        self.c=(random.randint(40,100),random.randint(30,80),random.randint(80,160))
    def draw(self,surf,rot,w,h):
        rv=self.v.ry(rot); cz=rv.z+CAM_DIST
        if cz<=10: return
        f=FOV/cz; sx=rv.x*f+w/2; sy=-rv.y*f+h/2
        d=min(1,cz/4000); r=self.r*f*0.3*(1-d)*0.5
        if r<5: return
        a=int(25*(1-d))
        s=pygame.Surface((int(r*2),int(r*2)),pygame.SRCALPHA)
        pygame.draw.circle(s,(*self.c,a),(int(r),int(r)),r)
        surf.blit(s,(sx-r,sy-r),special_flags=pygame.BLEND_ADD)

# shooting stars
class ShootingStar:
    def __init__(self):
        self.active=False; self.x=0; self.y=0; self.dx=0; self.dy=0
        self.life=0; self.max_life=0; self.trail=[]
    def spawn(self,w,h):
        self.x=random.uniform(w*0.2,w*0.8); self.y=random.uniform(h*0.05,h*0.3)
        angle=random.uniform(0.4,0.8); speed=random.uniform(4,8)
        self.dx=math.cos(angle)*speed; self.dy=math.sin(angle)*speed
        self.max_life=random.randint(40,80); self.life=0; self.active=True
        self.trail=[]
    def update(self,dt):
        if not self.active: return
        self.life+=1
        self.trail.append((self.x,self.y))
        if len(self.trail)>12: self.trail.pop(0)
        self.x+=self.dx; self.y+=self.dy
        self.dy+=0.05
        if self.life>self.max_life or self.x>W+20 or self.y>H+20:
            self.active=False
    def draw(self,surf):
        if not self.active: return
        fade=1-self.life/self.max_life
        for i,(tx,ty) in enumerate(self.trail):
            a=int(200*fade*(i/len(self.trail)))
            r=2*fade*(i/len(self.trail))+0.5
            s=pygame.Surface((int(r*4),int(r*4)),pygame.SRCALPHA)
            pygame.draw.circle(s,(255,255,255,a),(int(r*2),int(r*2)),r)
            surf.blit(s,(tx-r*2,ty-r*2),special_flags=pygame.BLEND_ADD)
        # head
        a=int(255*fade)
        pygame.draw.circle(surf,(255,255,255,a),(int(self.x),int(self.y)),2)

# ═══════════════════════ NODE ═══════════════════════
class Node:
    def __init__(self,i,x,y,z):
        self.i=i; self.b=Vec3(x,y,z); self.d=False; self.h=False
        self.ph=random.uniform(0,6.28); self.sc=0
        self.sparkles=[]  # [(phase, life)]
    def upd(self,dt,rot):
        self.ph+=dt*0.004; self.sc=min(self.sc+dt*0.003,1)
        return self.b.ry(rot)
    def draw(self,surf,w,h,wld):
        p=proj(wld,w,h)
        if p is None: return
        sx,sy,sz=p
        if self.d:
            p2=0.7+0.3*math.sin(self.ph); r=max(4*sz,2)
            c=tuple(int(a*p2) for a in (170,210,255))
            pygame.draw.circle(surf,c,(int(sx),int(sy)),int(r))
            gr=8*sz; s=pygame.Surface((int(gr*4),int(gr*4)),pygame.SRCALPHA)
            pygame.draw.circle(s,(170,210,255,20),(int(gr*2),int(gr*2)),gr)
            surf.blit(s,(sx-gr*2,sy-gr*2),special_flags=pygame.BLEND_ADD)
        elif self.h:
            p2=0.5+0.5*math.sin(self.ph); gr=(14+8*p2)*sz
            s=pygame.Surface((int(gr*4),int(gr*4)),pygame.SRCALPHA)
            for i in range(4):
                a=50-i*10; r=gr+i*5*sz; f=1-i*0.12
                c2=(int(GLOW[0]*f),int(GLOW[1]*f),GLOW[2],max(a,5))
                pygame.draw.circle(s,c2,(int(r),int(r)),r)
            surf.blit(s,(sx-r,sy-r),special_flags=pygame.BLEND_ADD)
            cr=max(4*sz,2); pygame.draw.circle(surf,(255,)*3,(int(sx),int(sy)),int(cr))
            lbl=F_SMALL.render(str(self.i+1),True,(255,)*3)
            bx=sx-lbl.get_width()//2-3; by=sy-max(20*sz,18)
            bg=pygame.Surface((lbl.get_width()+6,lbl.get_height()+4),pygame.SRCALPHA)
            bg.fill((0,0,0,140)); surf.blit(bg,(bx,by)); surf.blit(lbl,(bx+3,by+2))
        else:
            t=0.5+0.5*math.sin(self.ph); c=tuple(int(a*t*0.5) for a in (180,200,240))
            pygame.draw.circle(surf,c,(int(sx),int(sy)),max(int(2*sz),1))

# ═══════════════════════ PATTERN ═══════════════════════
class Pattern:
    def __init__(self,data,ci):
        self.data=data; self.ci=ci
        self.nodes=[Node(i,*s[:3]) for i,s in enumerate(data["stars"])]
        self.d=False; self.n=0; self.f=0; self.ma=0; self.dt=0; self.sc=False
        self.ii=None; self.ia=0; self.it=0; self.ip="idle"
        self.rot=0; self.drag=False; self.dpx=0
        self.miss_flash=0
    def st(self):
        if self.nodes: self.nodes[0].h=True
    def hit(self,px,py):
        if self.d: return None
        wld=[n.upd(0,self.rot) for n in self.nodes]
        for i,n in enumerate(self.nodes):
            p=proj(wld[i],W,H)
            if p is None: continue
            sx,sy,_=p
            if (px-sx)**2+(py-sy)**2<2000: return i
        return None
    def click(self,i):
        if self.d: return False
        ci=self.ci
        if i==self.n:
            self.nodes[i].d=True; self.nodes[i].h=False
            self.ii=i; self.ia=0; self.it=0; self.ip="showing"
            _get('click',0,0).play()
            play('note',ci,i,loops=-1,fade=1200)
            if self.n==0: play('drone',ci,loops=-1,fade=2000)
            if self.n in (1,3,5): play('chord',ci,self.n//2,loops=-1,fade=1500)
            self.n+=1
            if self.n>=len(self.nodes):
                self.d=True; self.dt=0; self.ma=0; stop_all(800)
                play('comp',ci,loops=0,fade=2000)
            else: self.nodes[self.n].h=True
            return True
        else:
            for n in self.nodes: n.d=False; n.h=False
            self.n=0; stop_all(400)
            _get('miss',0,0).play()
            self.miss_flash=30
            if self.nodes: self.nodes[0].h=True
            return False
    def upd(self,dt):
        self.f=min(self.f+dt*0.0015,1)
        wld=[n.upd(dt,self.rot) for n in self.nodes]
        if self.d:
            self.ma=min(self.ma+dt*0.004,1); self.dt+=1
            if self.dt>80: self.sc=True
        if self.miss_flash>0: self.miss_flash-=1
        if self.ip=="showing":
            self.ia=min(self.ia+dt*0.003,1); self.it+=1
            if self.it>300: self.ip="fading"
        elif self.ip=="fading":
            self.ia=max(self.ia-dt*0.003,0)
            if self.ia<=0: self.ip="idle"
        return wld
    def draw_e(self,surf,w,h,wld):
        for ai,bi in self.data["edges"]:
            if ai>=self.n: continue
            a=self.nodes[ai]; b=self.nodes[bi]
            if not(a.d or b.d): continue
            pa=proj(wld[ai],w,h); pb=proj(wld[bi],w,h)
            if pa is None or pb is None: continue
            al=int(150*self.f)
            for w2 in range(3,0,-1):
                a2=al//(4-w2)
                if a2>0: pygame.draw.line(surf,(130,180,255,a2),(pa[0],pa[1]),(pb[0],pb[1]),w2*2-1)
    def draw_fx(self,surf,w,h,wld):
        if not self.d: return
        for ai,bi in self.data["edges"]:
            pa=proj(wld[ai],w,h); pb=proj(wld[bi],w,h)
            if pa is None or pb is None: continue
            for _ in range(2):
                t=random.random()
                px=pa[0]+(pb[0]-pa[0])*t+random.uniform(-10,10)
                py=pa[1]+(pb[1]-pa[1])*t+random.uniform(-10,10)
                r=random.uniform(1,2)
                s=pygame.Surface((int(r*4),int(r*4)),pygame.SRCALPHA)
                pygame.draw.circle(s,(*GLOW,random.randint(15,45)),(int(r*2),int(r*2)),r)
                surf.blit(s,(px-r*2,py-r*2),special_flags=pygame.BLEND_ADD)
    def draw_n(self,surf,w,h,wld):
        for i,n in enumerate(self.nodes): n.draw(surf,w,h,wld[i])
    def draw_i(self,surf):
        if self.ip=="idle" or self.ii is None: return
        i=self.ii; sd=self.data["stars"][i]
        _,_,_,name,myth,culture=sd; a=int(255*self.ia)
        if a<=0: return
        cw,ch=min(W-80,600),120; cx,cy=(W-cw)//2,H-ch-30
        card=pygame.Surface((cw,ch),pygame.SRCALPHA)
        card.fill((8,6,28,min(210,a)))
        pygame.draw.rect(card,(*GLOW,min(70,a)),card.get_rect(),1,border_radius=10)
        card.blit(F_SNAME.render(name,True,(255,245,220)),(15,10))
        card.blit(F_SMALL.render(myth[:50],True,(200,210,240)),(15,42))
        card.blit(F_TINY.render(culture[:55],True,(140,160,210)),(15,68))
        card.blit(F_TINY.render("点击继续",True,(110,125,175)),(cw-75,ch-22))
        card.set_alpha(a); surf.blit(card,(cx,cy))

# ═══════════════════════ DRAW ═══════════════════════
def draw_bg(surf):
    for y in range(H):
        t=y/H
        pygame.draw.line(surf,(int(5+8*t),int(4+15*t),int(30+45*t)),(0,y),(W,y))

def draw_comp(surf,pat):
    over=pygame.Surface((W,H),pygame.SRCALPHA); over.fill((0,0,0,180)); surf.blit(over,(0,0))
    nt=F_TITLE.render(pat.data["name"],True,(255,240,200))
    surf.blit(nt,(W//2-nt.get_width()//2,H//2-100))
    for i,line in enumerate(pat.data["intro"].split("\n")):
        t=F_BODY.render(line,True,(200,215,255))
        surf.blit(t,(W//2-t.get_width()//2,H//2-20+i*32))
    ct=F_SMALL.render("点击继续",True,(140,150,190))
    surf.blit(ct,(W//2-ct.get_width()//2,H//2+80))

def draw_title(surf,a):
    nt=F_TITLE.render("✦ 星辰音疗 ✦",True,(255,245,220))
    surf.blit(nt,(W//2-nt.get_width()//2,H//2-100))
    st=F_NAME.render("—— 3D 星座物语 ——",True,(180,200,240))
    surf.blit(st,(W//2-st.get_width()//2,H//2-30))
    if a>0.5:
        ht=F_BODY.render("聆听星辰的故事",True,(150,170,210))
        ht.set_alpha(int(255*(0.5+0.5*math.sin(pygame.time.get_ticks()*0.003))))
        surf.blit(ht,(W//2-ht.get_width()//2,H//2+50))
        ht2=F_SMALL.render("点击任意处 踏入星空",True,(130,150,190))
        surf.blit(ht2,(W//2-ht2.get_width()//2,H//2+90))
    cv=pygame.Surface((W,H),pygame.SRCALPHA); cv.fill((0,0,0,int(255*(1-a)))); surf.blit(cv,(0,0))

# ═══════════════════════ MAIN ═══════════════════════
def main():
    global W,H,screen
    pats=[Pattern(d,i) for i,d in enumerate(C_DATA)]
    bg=[Star3D() for _ in range(300)]; neb=[Nebula() for _ in range(5)]
    ss=ShootingStar(); ss_timer=0
    cur=0; pat=pats[cur]; T=True; ta=0; cf=False; run=True

    while run:
        dt=clock.tick(60)
        mx,my=pygame.mouse.get_pos()

        # shooting star spawn
        ss_timer+=1
        if not ss.active and ss_timer>random.randint(300,800):
            ss.spawn(W,H); ss_timer=0

        for ev in pygame.event.get():
            if ev.type==pygame.QUIT: run=False
            elif ev.type==pygame.VIDEORESIZE:
                W,H=ev.w,ev.h; screen=pygame.display.set_mode((W,H),pygame.RESIZABLE)
            elif ev.type==pygame.KEYDOWN:
                if ev.key==pygame.K_ESCAPE: run=False
            elif ev.type==pygame.MOUSEBUTTONDOWN:
                if T: T=False; ta=1; pat.st()
                elif cf:
                    cf=False; cur=(cur+1)%len(pats); pat=pats[cur]; pat.st()
                elif pat.ip!="idle": pat.ip="fading"
                else:
                    r=pat.hit(mx,my)
                    if r is not None: pat.click(r)
                    else: pat.drag=True; pat.dpx=mx
            elif ev.type==pygame.MOUSEBUTTONUP:
                pat.drag=False
            elif ev.type==pygame.MOUSEMOTION:
                if pat.drag:
                    dx=mx-pat.dpx; pat.rot+=dx*0.01; pat.dpx=mx

        wld=pat.upd(dt)
        draw_bg(screen); rot=pat.rot if not T else 0

        if not T:
            for n in neb: n.draw(screen,rot,W,H)
            for b in bg: b.draw(screen,rot,W,H)
            ss.update(dt); ss.draw(screen)
            pat.draw_e(screen,W,H,wld); pat.draw_fx(screen,W,H,wld)
            pat.draw_n(screen,W,H,wld); pat.draw_i(screen)

            text=f"{pat.data['name']}  —  {cur+1}/{len(pats)}"
            t=F_NAME.render(text,True,(200,210,230)); screen.blit(t,(W//2-t.get_width()//2,22))
            if not pat.d and pat.ip=="idle":
                h=F_SMALL.render("按顺序点击闪烁的星星 · 拖拽旋转视角",True,(110,130,170))
                screen.blit(h,(W//2-h.get_width()//2,54))

            if pat.miss_flash>0:
                ms=F_SMALL.render("顺序不对，重新开始",True,(200,150,150))
                screen.blit(ms,(W//2-ms.get_width()//2,H-70))

            dy=H-30; tw=len(pats)*26; sx=W//2-tw//2
            for i in range(len(pats)):
                x=sx+i*26
                if i<cur: c,r=(170,210,255),5
                elif i==cur: c,r=(255,240,200) if not pat.d else (150,255,200),7
                else: c,r=(50,55,80),4
                pygame.draw.circle(screen,c,(x,dy),r)

            if pat.d and pat.sc: cf=True; draw_comp(screen,pat)
        else:
            for n in neb: n.draw(screen,0,W,H)
            for b in bg: b.draw(screen,0,W,H)
            ss.update(dt); ss.draw(screen)
            draw_title(screen,ta)

        pygame.display.flip()

    pygame.quit(); sys.exit()
if __name__=="__main__": main()

class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    add_mul(val, other) {
        this.x += val * other.x;
        this.y += val * other.y;
        this.z += val * other.z;
        return this;
    }
    add(other){
        return this.add_mul(1, other);
    }
    sub(other){
        return this.add_mul(-1, other);
    }
    scl(val){
        this.x *= val;
        this.y *= val;
        this.z *= val;
        return this;
    }
    inner(other){
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    copy(){
        return new Vector(this.x, this.y, this.z);
    }
    magSq(){
        return this.inner(this);
    }
    mag(){
        return Math.sqrt(this.magSq());
    }
    norm(){
        this.scl(1/this.mag());
        return this;
    }



    distSq(other){
        return this.csub(other).magSq();
    }

    cadd_mul(val, other){
        return this.copy().add_mul(val, other);
    }

    cadd(other){
        return this.cadd_mul(+1, other);
    }
    csub(other){
        return this.cadd_mul(-1, other);
    }

    cscl(val) {
        return this.copy().scl(val);
    }
    list(){
        return [this.x, this.y, this.z];
    }
}

const Vec = (x = 0, y = 0, z = 0) =>
    new Vector(x, y, z);

class Element {
    constructor() {
        this.fill = $.css_get("--high-A");
        this.stroke = $.css_get("--high-A");
        
        this.shown = true;
        this.draw_fn = () => {};
        this.set_constraint();
    }
    hide(){
        this.shown = false;
        return this;
    }
    show(){
        this.shown = true;
        return this;
    }

    update(diagram) {
        this.constrain(this);
    }
    draw(ctx, r, s) {
        if(this.shown){
            this.draw_fn(ctx, r, s);
        }
    }
    set_constraint(constrain = () => {}){
        this.constrain = constrain;
        return this;
    }

}
class Point extends Element {
    constructor(P) {
        super();
        this.P = P;
        this.R = 0.75;
        this.draw_fn = (ctx, r, s) => {
            let [x, y] = this.P.cscl(r).list();

            ctx.fillStyle = this.fill;
            ctx.beginPath();
            ctx.ellipse(x, -y, s * this.R, s * this.R, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = s * 0.5;
            ctx.strokeStyle = this.stroke;    
            ctx.beginPath();
            ctx.ellipse(x, -y, s * this.R, s * this.R, 0, 0, Math.PI * 2);
            ctx.stroke();
        };
    }
}
class DragPoint extends Point {
    constructor(P) {
        super(P);
    }
    update_mouse(mouse, r, s){
        let d = this.P.distSq(mouse.P);
        
        this.R = 1;
        if(this.drag){
            if(mouse.pressed) {
                this.P = mouse.P;
            }
            else {
                this.drag = false;
            }
        }
        else if(8 * d < s) {
            if(mouse.clicked){
                this.drag = true;
            }
            this.R = 1.5;
        }

        this.constrain(this);
    }
}
class Line extends Element {
    constructor(A, B){
        if(!(A instanceof Point && B instanceof Point)){        
            throw "Line expected Points";
        }

        super();
        [this.A, this.B] = [A, B];
        this.draw_fn = (ctx, r, s) => {
            let [ax, ay] = this.A.P.cscl(r).list();
            let [bx, by] = this.B.P.cscl(r).list();
    
            ctx.lineWidth = s;
            ctx.strokeStyle = this.stroke;
            
            ctx.beginPath();
            ctx.moveTo(ax, -ay);
            ctx.lineTo(bx, -by);
            ctx.stroke();
        };
    }
}
class Angle extends Element {
    constructor(O, A, B){
        if(!(A instanceof Point && B instanceof Point)){        
            throw "Line expected Points";
        }

        super();
        [this.O, this.A, this.B] = [O, A, B];
        this.r = 1;

        this.draw_fn = (ctx, r, s) => {
            let [x, y] = this.O.P.cscl(r).list();
            let A = this.A.P.csub(this.O.P);
            let B = this.B.P.csub(this.O.P);

            let φ = Math.atan2(A.y, A.x);

            ctx.lineWidth = s;
            ctx.strokeStyle = this.stroke;
            
            ctx.beginPath();
            ctx.stroke();
        };
    }
}
class Plane extends Element {
    constructor(O, A, B, R){
        if(!(O instanceof Point 
        && A instanceof Point 
        && B instanceof Point
        && R instanceof Point)){        
            throw "Line expected Points";
        }

        super();
        [this.O, this.A, this.B, this.R] = [O, A, B, R];
        this.draw_fn = (ctx, r, s) => {
            let [x, y] = this.O.P.cscl(r).list();
            let [ax, ay] = this.A.P.cscl(r).list();
            let [bx, by] = this.B.P.cscl(r).list();
            let [rx, ry] = this.R.P.cscl(r).list();
    
            ctx.fillStyle = this.fill;

            ctx.beginPath();
            ctx.moveTo(x, -y);
            ctx.lineTo(ax, -ay);
            ctx.lineTo(rx, -ry);
            ctx.lineTo(bx, -by);
            ctx.lineTo(x, -y);
            ctx.fill();
        };
    }
}

class Diagram {
    constructor(div, W, H) {
        const canvas = document.createElement("canvas");

        div.innerHTML = "";
        div.className = "diagram";
        div.appendChild(canvas);


        this.cnv = canvas;
        this.ctx = this.cnv.getContext("2d");
        this.ctx.lineCap = "round";

        this.W = W;
        this.H = H;

        this.mouse = {
            P: Vec(),   
            pressed: false
        }

        this.cnv.onmousemove = e => {
            let rect = this.cnv.getBoundingClientRect();
            let [X, Y] = [
                (rect.left + rect.right) * 0.5,
                (rect.top + rect.bottom) * 0.5
            ];

            this.mouse.P = Vec(e.clientX - X, Y - e.clientY).scl(this.scale/this.r);
            for(let elem of this.elems_mouse){
                elem.update_mouse(this.mouse, this.r/this.scale, this.s);
            }
            this.mouse.clicked = false;
        }
        this.cnv.onmouseup = e => {
            this.mouse.pressed = false;
        }
        this.cnv.onmousedown = e => {
            this.mouse.pressed = true;
            this.mouse.clicked = true;
        }

        this.s = 4;
        this.scale = 1;

        this.elems = [];
        this.elems_mouse = [];

        this.points = [];
        this.lines = [];
        this.angles = [];
        this.planes = [];

        this.set_updater();
    }

    drag_point(x = 0, y = 0, z = 0){
        let e = new DragPoint(Vec(x, y, z));
        this.elems_mouse.push(e);
        this.elems.push(e);
        this.points.push(e);
        return e
    }
    point(x = 0, y = 0, z = 0) {
        let e = new Point(Vec(x, y, z));
        this.elems.push(e);
        this.points.push(e);
        return e;
    }
    line(A, B) {
        const e = new Line(A, B);
        this.elems.push(e);
        this.lines.push(e);
        return e;
    }
    angle(O, A, B){
        const e = new Angle(O, A, B);
        this.elems.push(e);
        this.angles.push(e);
        return e;
    }

    plane(O, A, B, R) {
        const e = new Plane(O, A, B, R);
        this.elems.push(e);
        this.planes.push(e);
        return e;
    }

    set_updater = (updater = () => {}) => {
        this.updater = updater;
    }
    draw(){
        [this.cnv.width, this.cnv.height] = [this.W, this.H];
        this.r = Math.min(this.W, this.H) * 0.5;
        this.R = Math.max(this.W, this.H) * 0.5;

        this.ctx.width = this.W;
        this.ctx.height = this.H;

        this.ctx.fillStyle = $.css_get("--prim");
        this.ctx.fillRect(0, 0, this.W, this.H);

        this.ctx.save();
        this.ctx.translate(this.W * 0.5, this.H * 0.5);

        this.updater();

        for(let elem of this.elems){
            elem.update(this);
        }

        let draw_list = [];
        draw_list.push(...this.planes);
        draw_list.push(...this.angles);
        draw_list.push(...this.lines);
        draw_list.push(...this.points);
        for(let elem of draw_list){
            elem.draw(this.ctx, this.r/this.scale, this.s);
        }

        
        this.ctx.restore();
    }
    build (loop = false) {
        this.loop = loop;
        
        let draw = () => {
            this.draw();
            window.requestAnimationFrame(draw);
        }
        draw();
    }
}
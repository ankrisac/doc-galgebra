class Vector{
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    add(val, other){
        this.x += val * other.x;
        this.y += val * other.y;
        this.z += val * other.z;
    }
    draw() {
        
    }
}

const Vec = (x = 0, y = 0, z = 0) => 
    new Vector(x, y, z);
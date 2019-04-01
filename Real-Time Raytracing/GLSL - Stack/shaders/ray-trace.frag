precision highp float;

//
// How many items to remove from the stack;
uniform int remove;
varying vec3 vPos;

float epsilon= 0.0001;

const vec3 ambient = vec3(0.2);

vec3 eye = vec3(0.0, 0.0, 3.0);

struct Light {
    vec3 pos;
    vec3 color;
    float radius;
};

struct Ray {
    vec3 origin;
    vec3 direction;
    float t;
};

struct Plane {
    vec3 a;
    vec3 n;
    float percentReflect;
    vec3 color;
};

struct Sphere {
    vec3 center;
    float radius;
    float percentReflect;
    vec3 color;
};

struct Intersect {
    vec3 color;
    float percentReflect;
    
    bool hit;
    float t;
    vec3 normal;
    vec3 reflectedRay;
    vec3 pos;
};

Light light1;

// ------------------------------------------------------------------
//
// Implementation of a stack for use in GLSL.  Not pretty, but it gets
// the job done.
//
// ------------------------------------------------------------------
const int MAX_STACK_SIZE = 5;
const int STACK_POS_0 = 0;
const int STACK_POS_1 = 1;
const int STACK_POS_2 = 2;
const int STACK_POS_3 = 3;
const int STACK_POS_4 = 4;

struct StackItem {
    float data;
    vec3 color;
};

struct Stack {
    StackItem items[MAX_STACK_SIZE];
    int top;
} stack;


bool stackEmpty() {
    return stack.top == STACK_POS_0;
}

bool stackPush(StackItem item) {
    if (stack.top == (MAX_STACK_SIZE - 1)) return false;
    if (stack.top == STACK_POS_0) {
        stack.items[STACK_POS_0] = item;
    } else if (stack.top == STACK_POS_1) {
        stack.items[STACK_POS_1] = item;
    } else if (stack.top == STACK_POS_2) {
        stack.items[STACK_POS_2] = item;
    } else if (stack.top == STACK_POS_3) {
        stack.items[STACK_POS_3] = item;
    } else if (stack.top == STACK_POS_4) {
        stack.items[STACK_POS_4] = item;
    }

    stack.top++;
    return true;
}

StackItem stackPop() {
    stack.top--;
    if (stack.top == STACK_POS_0) {
        return stack.items[STACK_POS_0];
    } else if (stack.top == STACK_POS_1) {
        return stack.items[STACK_POS_1];
    } else if (stack.top == STACK_POS_2) {
        return stack.items[STACK_POS_2];
    } else if (stack.top == STACK_POS_3) {
        return stack.items[STACK_POS_3];
    } else if (stack.top == STACK_POS_4) {
        return stack.items[STACK_POS_4];
    }
    // Danger Will Robinson, no return if stack underflow!!
}

float raySphereIntersect(vec3 origin, vec3 destination, vec3 center, float radius){
    float t1, t2;
    vec3 originToCenter = origin - center;
    float a = dot(destination,destination);
    float b = 2.0 * dot(destination, originToCenter);
    float c = dot(originToCenter, originToCenter) - (radius*radius);
    float d = b*b - 4.0*a*c;
    if ( d < 0.0){ return -1.0;}

    t1 = (-b - sqrt(d))/(2.0*a);
    t2 = (-b + sqrt(d))/(2.0*a);

    if(t1 > 0.0 && t2 > 0.0){
        if(t1 < t2){
            return t1;
        }
        else{
            return t2;
        }
    }

    else if(t1 > 0.0){
        return t1;
    }

    
    return t2;
}



Intersect intersect(vec3 origin, vec3 destination, vec3 pos, vec3 normal, Sphere myFirstSphere[4], vec3 accum){//destination should be normalized
     
     float t = 0.0;
     float t2, t3;
     bool light;
     Intersect myIntersect;
     myIntersect.t = 100000.0;//1000000000000000000000.0;
     myIntersect.hit = false;
     //myIntersect.color = vec3(0);

    for(int i = 0; i < 4; i++){
        t2 = raySphereIntersect(origin, destination, myFirstSphere[i].center, myFirstSphere[i].radius);
        if (t2 < myIntersect.t && t2 > 0.0){
            myIntersect.t = t2;
            myIntersect.color = myFirstSphere[i].color;
            myIntersect.pos = origin + (myIntersect.t - epsilon)*destination;
            myIntersect.normal = normalize(myIntersect.pos - myFirstSphere[i].center);
            myIntersect.hit = true;
            myIntersect.reflectedRay = reflect(normalize(destination), normalize(myIntersect.normal));
            myIntersect.percentReflect = myFirstSphere[i].percentReflect;
        }
    }

     float numerator = dot((pos - origin), normal);
     float denominator = dot(destination, normal);
     if(denominator == 0.0){
        myIntersect.t = 0.0;
        myIntersect.percentReflect = 0.0;
        myIntersect.pos = origin + destination*(myIntersect.t - epsilon);
        //myIntersect.normal = vec3(0.0, 1.0, 0.0);
        myIntersect.color = vec3(1.0, 0.8, 0.458) ;
        myIntersect.hit = true;
        myIntersect.reflectedRay = reflect(normalize(destination), normalize(myIntersect.normal));
     }

     //t = (-2.0 - origin.y)/ destination.y;
     else if (denominator == 0.0 && numerator == 0.0){
         myIntersect.hit = false;
         myIntersect.color = vec3(0);
     }

     else{
        t = numerator/denominator;
        if (t < myIntersect.t && t > 0.0){
            myIntersect.t = t;
            myIntersect.percentReflect = 0.0;
            myIntersect.pos = origin + destination*(myIntersect.t - epsilon);
            myIntersect.normal = normal;
            myIntersect.color = vec3(1.0, 0.8, 0.458);
            myIntersect.hit = true;
            myIntersect.reflectedRay = reflect(normalize(destination), normalize(myIntersect.normal)); 
        }
     }

    // t3 = raySphereIntersect(origin, destination, light1.pos, light1.radius);
    // if (t3 < myIntersect.t && t3 >= 0.0){
    //     myIntersect.t = t3;
    //     //myIntersect.normal = normalize()
    //     myIntersect.color = light1.color;
    //     light = true;
    //     myIntersect.hit = true;
    // }


    //  if (myIntersect.hit == false){
    //      accum += ambient;
    //      myIntersect.color = accum;
    //  }

    return myIntersect;
}


vec3 computeLighting(vec3 finalColor, Intersect final, Ray toReverse, vec3 accum, Plane myFirstPlane, Sphere spheres[4]){
    float tLight;
    vec3 colorToReturn;
    float t;
    Intersect lightIntersect;
    //lightIntersect.t = 1.0;

    Ray myShadowRay;
    myShadowRay.origin = final.pos; //eye + final.t*toReverse.direction;
    myShadowRay.direction = light1.pos - myShadowRay.origin;



    // float numerator = dot((light1.pos - myShadowRay.origin), myFirstPlane.n);
    // float denominator = dot(myShadowRay.direction, myFirstPlane.n);
    //     t = numerator/denominator;
    //     if (t < 1.0){
    //         lightIntersect.hit = false;
    //         //pos = origin + destination*t;
    //        // myIntersect.normal = vec3(0.0, 1.0, 0.0);
    //        // myIntersect.color = vec3(1.0, 0.8, 0.458);
    //         //myIntersect.hit = true;
    //     }

    lightIntersect = intersect(myShadowRay.origin, myShadowRay.direction, myFirstPlane.a, myFirstPlane.n, spheres, accum);
     
     if (lightIntersect.hit && lightIntersect.t < 1.0){
         colorToReturn = finalColor*ambient;
     }
     else{
         //float d = clamp(dot(normalize(final.normal), normalize(myShadowRay.direction)), 0.0, 1.0);
         accum += light1.color;//*mask;
         colorToReturn = finalColor*accum ;
     }

    return colorToReturn;
}

vec3 specularDiffuse(Intersect final){
    vec3 vLight;
        vec3 vNormal;
        vec3 totalDiffuse = vec3(0,0,0);
        vec3 totalSpecular = vec3(0);
        vec3 totalLight = vec3(0,0,0);
        float specularReflect = 0.0;
        vLight = normalize(light1.pos - vPos);

        float IDiffuse = dot(vLight, normalize(final.normal));
        IDiffuse = clamp(IDiffuse, 0.0, 1.0);

        vec3 reflection = 2.0*IDiffuse*normalize(final.normal) - vLight;
        vec3 V = normalize(eye - vPos);

        if (IDiffuse > 0.0){
            specularReflect = pow(clamp(dot(V, normalize(reflection)),0.0, 1.0), 80.0);
        }
        else{
            specularReflect = 0.0;
        }

        totalSpecular = light1.color*specularReflect;
        totalDiffuse = light1.color * IDiffuse;
        totalLight = totalDiffuse + ambient + totalSpecular;

    
        vec3 color = final.color*totalLight;

        return color;

}

vec3 reflectRay(Intersect f, Plane myFirstPlane, Sphere spheres[4], vec3 accum){
    vec3 ray;

    stack.top = STACK_POS_0;

    stackPush(StackItem(1.0, vec3(0.0, 0.0, 0.5)));
    stackPush(StackItem(1.0, vec3(0.0, 0.5, 0.0)));
    stackPush(StackItem(1.0, vec3(0.5, 0.0, 0.0)));

    int howMany = 0;
    //StackItem item;
    if(!(f.hit && f.percentReflect == 0.0)){
        howMany++;
        StackItem next;
        next.color = specularDiffuse(f);
        next.data = f.percentReflect;
        f = intersect(f.pos, f.reflectedRay, myFirstPlane.a, myFirstPlane.n, spheres,  accum);
        stackPush(next);
    }

     if(!(f.hit && f.percentReflect == 0.0)){
        howMany++;
        StackItem next;
        next.color = specularDiffuse(f);
        next.data = f.percentReflect;
        f = intersect(f.pos, f.reflectedRay, myFirstPlane.a, myFirstPlane.n, spheres,  accum);
        stackPush(next);
    }

     if(!(f.hit && f.percentReflect == 0.0)){
        howMany++;
        StackItem next;
        next.color = specularDiffuse(f);
        next.data = f.percentReflect;
        f = intersect(f.pos, f.reflectedRay, myFirstPlane.a, myFirstPlane.n, spheres,  accum);
        stackPush(next);
    }

    vec3 answer = specularDiffuse(f);
	
	if(howMany == 3){
		howMany--;
		StackItem otherNext = stackPop();
		answer = otherNext.color*(1.0 - otherNext.data) + answer*otherNext.data;
	}

	if(howMany == 2){
		howMany--;
		StackItem otherNext = stackPop();
		answer = otherNext.color*(1.0 - otherNext.data) + answer* otherNext.data;
	}
	
	if(howMany == 1){
		howMany--;
		StackItem otherNext = stackPop();
		answer = otherNext.color*(1.0 - otherNext.data) + answer*otherNext.data;
	}
	
    return answer;

    //stackPush(item);






    // if (howMany == 3) {
    //     item = stackPop();
    //     howMany--;
    // }
    // if (howMany == 2) {
    //     item = stackPop();
    //     howMany--;
    // }
    // if (howMany == 1) {
    //     item = stackPop();
    //     howMany--;
    // }

}

void main() {
    //vec3 mask = vec3(1.0);
    vec3 accum = vec3(0.0);
    gl_FragColor.rgb = vec3(0.0, 0.0, 0.0);
    vec3 color;

    light1.pos = vec3(-3.0, 3.0, 1.0);
    //light1.radius = 0.5;
    light1.color = vec3(1.0, 0.8, 0.6);

     Ray myFirstRay;
     myFirstRay.origin = eye;
     myFirstRay.direction = vPos - eye;

     Plane myFirstPlane;
     myFirstPlane.a = vec3(-1.0, -1.0, 0.0);
     myFirstPlane.n = vec3(0.0, 1.0, 0.0);
     myFirstPlane.percentReflect = 0.0;
     myFirstPlane.color = vec3(1.0, 0.8, 0.458);

     Sphere myFirstSphere;
     myFirstSphere.center = vec3(0.0, -0.5, -2.0);
     myFirstSphere.radius = 1.2;
     myFirstSphere.percentReflect = 1.0;
     myFirstSphere.color = vec3(0.0, 0.8, 0.458);

     Sphere mySecondSphere;
     mySecondSphere.center = vec3(1.0, 1.0, -3.0);
     mySecondSphere.radius = 0.5;
     mySecondSphere.percentReflect = 0.2;
     mySecondSphere.color = vec3(1.0, 0.0, 1.0);

     Sphere myThirdSphere;
     myThirdSphere.center = vec3(-1.0, 1.0, -2.0);
     myThirdSphere.radius = 0.5;
     myThirdSphere.percentReflect = 0.0;
     myThirdSphere.color = vec3(0.0, 0.8, 0.458);

     Sphere myFourthSphere;
     myFourthSphere.center = vec3(0.0, -1.0, 0.0);
     myFourthSphere.radius = 20.0;
     myFourthSphere.percentReflect = 0.0;
     myFourthSphere.color = vec3(0.99, 0.357, 0.207);

     Sphere spheres[4];
     spheres[0] = myFirstSphere;
     spheres[1] = mySecondSphere;
     spheres[2] = myThirdSphere;
     spheres[3] = myFourthSphere;
    
    vec3 totalLight;

    Intersect final = intersect(myFirstRay.origin, myFirstRay.direction, myFirstPlane.a, myFirstPlane.n, spheres, accum);
    //color = final.color;

    if (final.hit == true && final.percentReflect > 0.0){
        final.color = reflectRay(final, myFirstPlane, spheres, accum);
    }
    else if(final.hit){
        final.color = specularDiffuse(final);
        //computeLighting(color)
    }

    //totalLight = specularDiffuse(final);
    
    //color = final.color*totalLight;


    gl_FragColor.rgb = computeLighting(final.color, final, myFirstRay, accum, myFirstPlane, spheres);
    

    // if(raySphereIntersect(myFirstRay.origin, myFirstRay.direction, myFirstSphere.center, myFirstSphere.radius) == true){
    //     gl_FragColor.rgb = vec3(1.0, 0.8, 0.458);
    // }


    //gl_FragColor.rgb = item.color;
    gl_FragColor.a = 1.0;
}

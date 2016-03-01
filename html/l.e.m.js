// HTML Variables
var lem_screen;
var lem_ctx;
var background_screen;
var background_ctx;
var g=1
var vThrust=5
var hThrust=2

// display
var vx,vy,alt

// State Variables
var lem;
var run=false
var lz_width=50
var lz_height=3
var lz_x,lz_y

var terrain_roughness=30
var terrain_points=100
var terrain_min=400
var terrain_max=500
var terrain_x=[]
var terrain_y=[]

// Background variables

function terrain(x)
{
	var ndx=0
	while( x>terrain_x[ndx] ) ndx++
	return terrain_y[ndx-1]+(terrain_y[ndx]-terrain_y[ndx-1])*(x-terrain_x[ndx-1])/(terrain_x[ndx]-terrain_x[ndx-1])
}

function LEM()
{
	this.x=0
	this.y=0
	this.vx=0
	this.vy=0
	this.fuel_capacity=100;
	this.fuel=this.fuel_capacity;
	this.thrust_left=0
	this.thrust_right=0
	this.thrust_down=0
	this.t0=performance.now()
}

function updatePosition(t1)
{
	if(run)
	{
		var t=(t1-this.t0)/1000
		this.t0=t1
		var ax=hThrust*(this.thrust_left-this.thrust_right)
		var ay=g-(this.thrust_down*vThrust)
		this.x=.5*ax*t*t + this.vx*t + this.x
		this.vx=ax*t + this.vx
		this.y=.5*ay*t*t + this.vy*t + this.y
		this.vy=ay*t + this.vy
		// calculate fuel
		this.fuel=this.fuel-t*(hThrust*(this.thrust_left+this.thrust_right)+vThrust*this.thrust_down)
		if( this.fuel<=0 )
		{
			this.thrust_left=0
			this.thrust_right=0
			this.thrust_down=0
		}
		fuel.innerHTML=Math.round(100*this.fuel/this.fuel_capacity)+'%'
		alt.innerHTML=Math.round(terrain(this.x)-this.y-10)
		vx.innerHTML=Math.round(this.vx)
		vy.innerHTML=Math.round(this.vy)
		// check for abort
		if( lem.y<-10 || lem.x<-10 || lem.x>lem_screen.width+10 )
		{
			console.log("Left pad: "+(terrain(this.x-10)-this.y-10))
			console.log("Right pad: "+(terrain(this.x+10)-this.y-10))
			console.log("Vx: "+this.vx)
			console.log("Vy: "+this.vy)
			console.log("x: "+this.x)
			console.log("y: "+this.y)
			console.log("t: "+t)
			run=false;
			show_status()
			spacebar_function=start
			type_status("Mission Abotred!\nPress <spacebar> to try again.")
			console.log('aborted') 
		}
		// check collision
		if( (terrain(this.x-10)-this.y-10)<=0 || (terrain(this.x+10)-this.y-10)<=0 )
		{
			var dy=lz_y-this.y-10
			var dx=lz_x+lz_width/2-this.x
			var dlz=Math.sqrt(dy*dy+dx*dx)
			console.log("Distance to Landing Zone: "+dlz)
			console.log("Left pad: "+(terrain(this.x-10)-this.y-10))
			console.log("Right pad: "+(terrain(this.x+10)-this.y-10))
			console.log("Vx: "+this.vx)
			console.log("Vy: "+this.vy)
			console.log("x: "+this.x)
			console.log("y: "+this.y)
			console.log("t: "+t)
			run=false;
			show_status()
			spacebar_function=start
			if(check_crash(this)) 
			{ 
				explode()
				type_status("Mission Failed: Hard landing!\nPress <spacebar> to try again.")
				console.log('crashed') 
			}
			else
			{
				type_status("Mission Success\nDistance to Landing Zone: "+Math.round(dlz)+"\nPress <spacebar> to try again.")
				console.log('landed') 
			}
		}
	}
}
LEM.prototype.updatePosition=updatePosition

function check_crash(l)
{
	v=Math.sqrt(l.vx*l.vx+l.vy*l.vy)
	return (v>10) 
}

function create_background()
{
	terrain_x=[]
	terrain_y=[]

	terrain_min=.5*background_screen.height
	terrain_max=.75*background_screen.height

	terrain_x.push(0)
	terrain_y.push(Math.floor(Math.random()*(terrain_max-terrain_min)+terrain_min))
	var x=0;
	while( (x=Math.floor(x+Math.random()*5+5))<background_screen.width)
	{
		terrain_x.push(x)
		terrain_y.push(Math.max(terrain_min,Math.min(terrain_max,terrain_y[terrain_y.length-1]+Math.floor(Math.random()*terrain_roughness-(terrain_roughness/2)))))
	}
	terrain_x.push(background_screen.width)
	terrain_y.push(terrain_y[terrain_y.length-1]+Math.floor(Math.random()*terrain_roughness-(terrain_roughness/2)))

	var ndx=Math.floor(Math.random()*terrain_x.length/2+terrain_x.length/4)
	lz_x=terrain_x[ndx]
	lz_y=terrain_y[ndx]
	while(terrain_x[ndx]<lz_x+lz_width)
	{
		terrain_y[ndx]=lz_y
		ndx++
	}
	terrain_y[ndx]=lz_y
}

function paint_background()
{
	background_ctx.clearRect(0,0,background_screen.width,background_screen.height)
	background_ctx.beginPath()
	background_ctx.moveTo(terrain_x[0],terrain_y[0])
	for(var i=1;i<terrain_x.length;i++)
	{
		background_ctx.lineTo(terrain_x[i],terrain_y[i])
	}
	background_ctx.strokeStyle="#00ff00"
	background_ctx.stroke()
	background_ctx.fillStyle="#00ff00"
	background_ctx.fillRect(lz_x,lz_y,lz_width,lz_height)
}

var lem_x
var lem_y

function clear_lem()
{
	lem_ctx.clearRect(lem_x-10,lem_y-10,40,40)
}

function cls_lem()
{
	lem_ctx.clearRect(0,0,lem_screen.width,lem_screen.height)
}


var particles=[]
function explode()
{
	var Pcount=Math.floor(Math.random()*20+10)
	for(var i=0;i<Pcount;i++)
	{
		particles.push({vx: Math.random()*20-10, vy: -Math.random()*20, x:lem.x, y:lem.y})
	}
	particles.t0=performance.now()
	console.log("exploded")
	console.log(particles)
	window.requestAnimationFrame(paint_explosion)
}

function paint_explosion(t)
{
	var remove_particles=[]
	var dt=(t-particles.t0)/1000
	particles.t0=t
	lem_ctx.beginPath()
	for(var i=0; i<particles.length; i++)
	{
		var p=particles[i]
		lem_ctx.moveTo(p.x,p.y)
		p.x=           p.vx*dt+p.x
		p.y=.5*g*dt*dt+p.vy*dt+p.y
		p.vy=g*dt+p.vy
		lem_ctx.lineTo(p.x,p.y)
		if( p.x<0 || p.x>lem_screen.width || p.y>terrain(p.x) )
		{
			remove_particles.push(i)
		}
	}
	lem_ctx.stroke()

	for( var i=remove_particles.length; i>0; i-- )
	{
		particles.splice(remove_particles[i-1],1)
	}
	if( particles.length>0 ) window.requestAnimationFrame(paint_explosion)
}


function paint_lem(t)
{
	clear_lem()
	lem.updatePosition(t)
	lem_x=lem.x-10
	lem_y=lem.y-10
	lem_ctx.fillStyle="#00ff00"
	lem_ctx.strokeStyle="#00ff00"

	lem_ctx.fillRect(lem_x,lem_y+18,5,2)
	lem_ctx.fillRect(lem_x+15,lem_y+18,5,2)
	lem_ctx.beginPath()
	lem_ctx.rect(lem_x+5,lem_y+8,10,5)
	lem_ctx.moveTo(lem_x+7.5,lem_y+8)
	lem_ctx.lineTo(lem_x+2.5,lem_y+4)
	lem_ctx.lineTo(lem_x+7.5,lem_y)
	lem_ctx.lineTo(lem_x+12.5,lem_y)
	lem_ctx.lineTo(lem_x+17.5,lem_y+4)
	lem_ctx.lineTo(lem_x+12.5,lem_y+8)
	lem_ctx.closePath()
	lem_ctx.moveTo(lem_x+2.5,lem_y+19)
	lem_ctx.lineTo(lem_x+7.5,lem_y+10.5)
	lem_ctx.moveTo(lem_x+17.5,lem_y+19)
	lem_ctx.lineTo(lem_x+12.5,lem_y+10.5)
	lem_ctx.stroke()


	if(lem.thrust_left)
	{
		lem_ctx.moveTo(lem_x,lem_y+10)
		lem_ctx.lineTo(lem_x-5,lem_y+10)
	}
	if(lem.thrust_right)
	{
		lem_ctx.moveTo(lem_x+20,lem_y+10)
		lem_ctx.lineTo(lem_x+25,lem_y+10)
	}
	if(lem.thrust_down)
	{
		lem_ctx.moveTo(lem_x+10,lem_y+20)
		lem_ctx.lineTo(lem_x+10,lem_y+25)
	}
	lem_ctx.stroke()
	if(run) window.requestAnimationFrame(paint_lem)
}

function toggle_run()
{
	run=!run
	if( run )
	{
		lem.t0=performance.now()
		window.requestAnimationFrame(paint_lem)
	}
}

var spacebar_function=toggle_run

// 40 down arrow
// 37 left arrow
// 38 right arrow
function keyDown(e)
{
	console.log("keyDown: ")
	console.log(e)
	t=performance.now()
	var keyCode = ('which' in e) ? e.which : e.keyCode;
	console.log("keyDown: "+keyCode)
	e.preventDefault()
	if( lem && lem.fuel>0 )
	{
		if( keyCode==40 )
		{
			if( !lem.thrust_down ) lem.updatePosition(t)
			lem.thrust_down=true
		}
		else if( keyCode==37 )
		{
			if( !lem.thrust_left ) lem.updatePosition(t)
			lem.thrust_left=true
		}
		else if( keyCode==39 )
		{
			if( !lem.thrust_right ) lem.updatePosition(t)
			lem.thrust_right=true
		}
	}
}

function keyUp(e)
{
	t=performance.now()
	var keyCode = ('which' in e) ? e.which : e.keyCode;
	if( keyCode==40 )
	{
		if( lem.thrust_down ) lem.updatePosition(t)
		lem.thrust_down=false
		e.preventDefault()
	}
	else if( keyCode==37 )
	{
		if( lem.thrust_left ) lem.updatePosition(t)
		lem.thrust_left=false
		e.preventDefault()
	}
	else if( keyCode==39 )
	{
		if( lem.thrust_right ) lem.updatePosition(t)
		lem.thrust_right=false
		e.preventDefault()
	}
	else if( keyCode==32 )
	{
		spacebar_function()
	}
}

var status_elem,status_text;
var status_speed=70;
var caret=false;

function show_status()
{
	status_elem.style.display=""
}

function hide_status()
{
	status_elem.style.display="none"
}

function type_status(s,f,n)
{
	f=f||function() {}
	n=n||0
	var delay=status_speed
	var c=s.charAt(n)
	if( c=="\n" )
	{
		c="<br/>"
		delay*=2
	}
	else if( c==" " )
	{
		delay*=1.5
	}
	status_text.innerHTML=(n>0?status_text.innerHTML:'')+c
	window.setTimeout(n+1<s.length?function() {type_status(s,f,n+1);}:f,delay)
}

function start()
{
	hide_status()
	particles=[]
	cls_lem()
	create_background()
	paint_background()

	lem=new LEM()
	lem.y=Math.floor(Math.random()*20+10)
	lem.x=Math.floor((Math.random()*.5+.25)*lem_screen.width)
	lem.vx=Math.random()*20-10
	lem.t0=performance.now()
	status_elem.style.display="none"
	spacebar_function=toggle_run
	toggle_run()
}

function init()
{
	status_elem=document.getElementById('status')
	status_text=document.getElementById('status_text')
	setInterval(function() { caret=!caret; status_text.style.borderRight=caret?"2px solid #00ff00":"2px solid #000000" },500)
	fuel=document.getElementById('fuel')
	vx=document.getElementById('vx')
	vy=document.getElementById('vy')
	alt=document.getElementById('alt')
	lem_screen=document.getElementById('lem')
	lem_ctx=lem_screen.getContext('2d')
	background_screen=document.getElementById('background')
	background_ctx=background_screen.getContext('2d')
	document.addEventListener("keydown",keyDown)
	document.addEventListener("keyup",keyUp)
	spacebar_function=start
	type_status("Welcome to Lunar Excursion Module (L.E.M.)\n"+
"Use the arrow keys [←,→,↓] to activate thrusters\n"+
"Press <spacebar> to begin")
}
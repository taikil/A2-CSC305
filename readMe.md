# A short WebGL Animation

[4 Marks] At least one hierarchical object of at least two-levels in the hierarchy  (e.g. human arm body -> shoulder -> elbow -> wrist...).
    Complete, multiple examples but best example is probably the jellyfish in the renderJellyFish Function in main.js defined at line 775

[6 Marks] Make use of at least two textures either procedural or mapped. You must map them to a(n) object(s) in a meaningful way. 
Using the textures from the Lab modified assignment base code does not count toward the two. 
Simply placing a texture on a default object using the default object coords does not count. 
Using textures as in the lab code with no meaningful or non-trivial development does not count.
    Complete, Two textures, defined in and loaded with the blendTexture, used to combine two water textures, there is also a wooden texture used for the dock.

[5 Marks] Convert the ADS shader in the assignment base code from a vertex shader to a fragment shader. 
You need to compute the lighting equation per fragment.
    Complete, see main.html

[2 Marks] Convert the Phong to Blinn-Phong in the new fragment shader created in step 3.
    Complete, main.html line 58, 66
[5 Marks] At least one shader edited or designed from scratch to perform a clearly visible effect. 
Each line of your shader code must be commented clearly explaining exactly what the following line does and why.
You must clearly identify the purpose and effect the shader produces in the submitted README.
    There are two minor shader edits, one is titled "tint" and it is used to add a red tint to the fragments,
    the other is "Grayscale" which computes the average color to create a gray effect.

[4 Marks] 360 degree camera fly around using lookAt() and setMV() to move the camera in a circle while focusing on a point that the camera is circling. 
This can be a single fly around or can be a part of a composed scene or can be a loop.
    Complete, moveCamera() function line 970 in main.js

[4 Marks] Connection to real-time. You should make sure that your scene runs in real-time on fast enough machines. 
Real-time means that one simulated second corresponds roughly to one real second.
    Complete,

[2 Marks] You should display the frame rate of your program in the console window or the graphics window once every 2 seconds.
    Complete, line 559
[5 Marks] Complexity: scene setup and design, movement of animated elements, and programming.
[5 Marks] Creativity: storytelling, scene design, object appearance and other artistic elements.
[5 Marks] Quality:  Attention to detail, modelling quality, rendering quality, motion control.
[2 Marks] Programming style.
    Oh yeah
[-2 Marks if not] Make and submit a movie of your animation. The movie should be at least 512x512 resolution and in a standard format, such as mp4. 
Include a cover image (png or jpg) of at least 512x512 pixels. You may use any screen capture program that is available (e.g. ShareX).
[-4 Marks if not] Provide a readme.txt that describes what you have done, what you have omitted,
 and any other information that will help the grader evaluate your work, including what is stated below.

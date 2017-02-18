#Image-Resizer

**Resizer**

To change the size of an image you can pass width and height(w and h) in the url.

This is the default method if there is no method is defined. 

1.  Width and height
    To change the width and height to a fixed number. 
    [http://localhost:3000/demo/image/upload/w_200,h_150/1.jpg](http://localhost:3000/demo/image/upload/w_200,h_150/1.jpg)


2.  Only width or height
    To change the width or height to a fixed number while scaling the other one according to original proportions.
    [http://localhost:3000/demo/image/upload/h_200/1.jpg](http://localhost:3000/demo/image/upload/h_200/1.jpg)


3.  Width or height between 0 and 1
    To scale the width and height according to given value.
    [http://localhost:3000/demo/image/upload/w_.6/1.jpg](http://localhost:3000/demo/image/upload/w_.6/1.jpg)

**Cropper**
To work with cropper first you need to specify the crop function(c_crop).To crop the image you can pass x, y, width, height, gravity(x, y, w, h and g) in the url.x, y, width and height

1.  To crop the image from (x, y) pixel to (x + width, y + height) pixel.
    [http://localhost:3000/demo/image/upload/c_crop,x_200,y_700,w_250,h_300/2.jpg](http://localhost:3000/demo/image/upload/c_crop,x_200,y_700,w_250,h_300/2.jpg)

2.  Gravity, width and height
    To crop the image at the "north_east, north, north_west, west, south_west, south, south_east, east, or center" regions of the image.
    [http://localhost:3000/demo/image/upload/c_crop,g_east,w_250,h_300/2.jpg](http://localhost:3000/demo/image/upload/c_crop,g_east,w_250,h_300/2.jpg)

3.  Aspect Ratio(ar in the url)
    To crop the image according to a new aspect ratio
    [http://localhost:3000/demo/image/upload/c_crop,ar_5/2.jpg](http://localhost:3000/demo/image/upload/c_crop,ar_5/2.jpg)

**Rotate**

To rotate the image after the given methods are finished
You need to pass an angle(a) in the url.
This method will adjust width and height to fit the rotated image accordingly.
For image types other than '.png' the default background color is white.

[http://localhost:3000/demo/image/upload/c_crop,x_400,w_200,h_0,h_200,a_90/superman.jpg](http://localhost:3000/demo/image/upload/c_crop,x_400,w_200,h_0,h_200,a_90/superman.jpg)


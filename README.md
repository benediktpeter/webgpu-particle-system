# A Particle System in WebGPU
Bachelor thesis project for TU Wien by Benedikt Peter.

## How to run
Note: WebGPU currently requires Chrome Canary with the **enable-unsafe-webgpu** flag enabled.

* Clone or download the program to your pc.
* Use the command **npm install** to install the dependencies.
* Compile with one of the the commands: **npm run dev**, **npm run prod**, or **npm run watch**.
* Run the server with an IDE and go to **http://127.0.0.1:5500** in Chrome Canary.

## Benchmarking
To use the benchmarking feature the browser must support timestamp queries. For Chrome this is allowed when launching with the "--disable-dawn-features=disallow_unsafe_apis" flag. After loading the site in a browser that supports timestamp queries, a benchmark can be run by entering the duration in seconds into the "Duration" field and then pressing the "Start Benchmarking" button. After the benchmark is finished you will receive a csv file in which every row contains the start and end times for both the compute pass and the render pass for a frame.


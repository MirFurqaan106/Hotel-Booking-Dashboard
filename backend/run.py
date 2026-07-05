import uvicorn

if __name__ == "__main__":
    print("=========================================")
    print("Starting Panun Ghar Booking Backend Server")
    print("Address: http://127.0.0.1:8000")
    print("Documentation: http://127.0.0.1:8000/docs")
    print("=========================================")
    
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

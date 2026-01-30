from fastapi import Header, HTTPException

def get_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
         raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    return authorization.split(" ")[1]

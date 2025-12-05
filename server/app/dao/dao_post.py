from app import db
from app.models import Post
import json

def create_post(title,content,img_list):
     # ---- Validate ----
    if not title or title.strip() == "":
        raise ValueError("Tiêu đề không được để trống")

    if not content or content.strip() == "":
        raise ValueError("Nội dung không được để trống")

    # img_list phải là list và không được rỗng
    if not isinstance(img_list, list) or len(img_list) == 0:
        raise ValueError("Danh sách ảnh không được để trống")

    # Check từng ảnh trong list
    for img in img_list:
        if not img or str(img).strip() == "":
            raise ValueError("Ảnh trong danh sách không được để trống")

    # ---- Convert list → JSON string ----
    img=json.dumps(img_list)

    # ---- Create object ----
    post = Post(
        title=title.strip(),
        content=content.strip(),
        img=img,
    )

    # ---- Save DB ----
    db.session.add(post)
    db.session.commit()

    return post

def get_all_post():
    return Post.query.all()

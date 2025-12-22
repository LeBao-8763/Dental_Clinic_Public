from app import db
from app.models import Post
import json

def create_post(title,content,img_list):
    if not title or title.strip() == "":
        raise ValueError("Tiêu đề không được để trống")

    if not content or content.strip() == "":
        raise ValueError("Nội dung không được để trống")

    if not isinstance(img_list, list) or len(img_list) == 0:
        raise ValueError("Danh sách ảnh không được để trống")

    for img in img_list:
        if not img or str(img).strip() == "":
            raise ValueError("Ảnh trong danh sách không được để trống")

    img=json.dumps(img_list)

    post = Post(
        title=title.strip(),
        content=content.strip(),
        img=img,
    )

    db.session.add(post)
    db.session.commit()

    return post

def get_all_post():
    return Post.query.all()

def get_post_by_id(post_id):
    return Post.query.get(post_id)

def update_post(post_id, title=None, content=None, img_list=None):
    post = Post.query.get(post_id)
    if not post:
        return None
    if title: post.title = title
    if content: post.content = content
    if img_list is not None: post.img_list = img_list
    db.session.commit()
    return post

def delete_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return False
    db.session.delete(post)
    db.session.commit()
    return True
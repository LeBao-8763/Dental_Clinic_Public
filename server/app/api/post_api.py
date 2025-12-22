from app.dao import dao_post
from flask import request
from flask_restx import Resource
from app.api_conf import post_model,post_ns,post_creation_parser
from cloudinary import uploader

@post_ns.route('/')
class Post(Resource):
    @post_ns.doc('create_post')
    @post_ns.expect(post_creation_parser)
    @post_ns.marshal_with(post_model, code=201)
    def post(self):
        args=post_creation_parser.parse_args()
        title = args.get('title')
        content = args.get('content')

        img_files = request.files.getlist('img')

        if not img_files or len(img_files) == 0:
            return {"message": "Phải upload ít nhất 1 ảnh"}, 400
        
        img_urls=[]
        for file in img_files:
            upload_result = uploader.upload(file)
            upload_path=upload_result.get('secure_url')

            img_urls.append(upload_path)

        post = dao_post.create_post(
            title=title,
            content=content,
            img_list=img_urls
        )

        return post, 200

    @post_ns.doc('get_list_post')
    @post_ns.marshal_with(post_model, code=201) 
    def get(self):
        posts=dao_post.get_all_post()

        if posts:
            return posts,201
        return 500

@post_ns.route('/<int:post_id>')
class PostDetail(Resource):
    @post_ns.doc('get_post_by_id')
    @post_ns.marshal_with(post_model)
    def get(self, post_id):
        post = dao_post.get_post_by_id(post_id)
        if post:
            return post, 200
        return {"msg": "Không tìm thấy bài viết"}, 404

@post_ns.route('/<int:post_id>/update')
class UpdatePost(Resource):
    @post_ns.doc('update_post')
    @post_ns.expect(post_creation_parser, validate=True)
    @post_ns.marshal_with(post_model, code=200)
    def patch(self, post_id):
        args = post_creation_parser.parse_args()
        title = args.get('title')
        content = args.get('content')

        img_files = request.files.getlist('img')
        img_urls = []
        if img_files:
            for file in img_files:
                upload_result = uploader.upload(file)
                img_urls.append(upload_result.get('secure_url'))

        updated_post = dao_post.update_post(
            post_id=post_id,
            title=title,
            content=content,
            img_list=img_urls if img_urls else None
        )
        if updated_post:
            return updated_post, 200
        return {"msg": "Không tìm thấy bài viết"}, 404

@post_ns.route('/<int:post_id>/delete')
class DeletePost(Resource):
    @post_ns.doc('delete_post')
    def delete(self, post_id):
        success = dao_post.delete_post(post_id)
        if success:
            return {"msg": "Đã xóa bài viết"}, 200
        return {"msg": "Không tìm thấy bài viết"}, 404
from app.dao import dao_post
from flask import Flask, request, jsonify
from flask_restx import Resource
from app.api_conf import post_model,post_ns,post_creation_parser
from cloudinary import uploader

@post_ns.route('/')
class Post(Resource):
    @post_ns.doc('create_post')
    @post_ns.expect(post_creation_parser)   # Định nghĩa định dạng request body cho Swagger UI
    @post_ns.marshal_with(post_model, code=201) # Định nghĩa định dạng response và mã trạng thái khi tạo thành công
    def post(self):
        "Tạo bài viết mới"
        args=post_creation_parser.parse_args()
        title = args.get('title')
        content = args.get('content')

        # Lấy list file upload
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
        "Lấy danh sách bài viết"
        posts=dao_post.get_all_post()

        if posts:
            return posts,201
        return 500
    

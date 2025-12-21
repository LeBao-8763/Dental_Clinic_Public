from flask import request, redirect

from app import create_app, login
from app.dao import dao_user
from flask_login import login_user

app = create_app()

@app.route('/admin-login', methods=['POST'])
def admin_login():
    username = request.form['username']
    password = request.form['password']

    user = dao_user.check_login(username, password)
    if user:
        login_user(user)
    return redirect('/admin')

@login.user_loader
def load_user(user_id):
    return dao_user.get_user_by_id(user_id)

if __name__ == "__main__":
    app.run(debug=True)

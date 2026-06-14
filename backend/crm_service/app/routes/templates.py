from flask import Blueprint, request, jsonify
from app.models import db, Template
from app.services.ai_service import generate_email_template, rewrite_template_block
from sqlalchemy import desc

bp = Blueprint('templates', __name__)

@bp.route('/', methods=['GET'])
def get_templates():
    sort_by = request.args.get('sort', 'updated_at')
    
    if sort_by == 'revenue':
        query = Template.query.order_by(desc(Template.revenue_generated))
    elif sort_by == 'opened':
        query = Template.query.order_by(desc(Template.messages_opened))
    elif sort_by == 'clicked':
        query = Template.query.order_by(desc(Template.messages_clicked))
    else:
        query = Template.query.order_by(desc(Template.updated_at))
        
    templates = query.all()
    result = []
    for t in templates:
        result.append({
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "subject_line": t.subject_line,
            "preheader": t.preheader,
            "thumbnail": t.thumbnail,
            "times_used": t.times_used,
            "messages_sent": t.messages_sent,
            "messages_delivered": t.messages_delivered,
            "messages_opened": t.messages_opened,
            "messages_clicked": t.messages_clicked,
            "conversion_rate": t.conversion_rate,
            "revenue_generated": t.revenue_generated,
            "created_at": t.created_at.isoformat(),
            "updated_at": t.updated_at.isoformat()
        })
    return jsonify({"templates": result})

@bp.route('/<int:id>', methods=['GET'])
def get_template(id):
    t = Template.query.get_or_404(id)
    return jsonify({
        "id": t.id,
        "name": t.name,
        "category": t.category,
        "subject_line": t.subject_line,
        "preheader": t.preheader,
        "thumbnail": t.thumbnail,
        "html_content": t.html_content,
        "json_content": t.json_content,
        "versions_json": t.versions_json,
        "times_used": t.times_used,
        "messages_sent": t.messages_sent,
        "messages_delivered": t.messages_delivered,
        "messages_opened": t.messages_opened,
        "messages_clicked": t.messages_clicked,
        "conversion_rate": t.conversion_rate,
        "revenue_generated": t.revenue_generated,
        "created_at": t.created_at.isoformat(),
        "updated_at": t.updated_at.isoformat()
    })

@bp.route('/', methods=['POST'])
def create_template():
    data = request.json
    t = Template(
        name=data.get('name', 'Untitled Template'),
        category=data.get('category', 'Newsletter'),
        subject_line=data.get('subject_line'),
        preheader=data.get('preheader'),
        thumbnail=data.get('thumbnail'),
        html_content=data.get('html_content'),
        json_content=data.get('json_content', [])
    )
    db.session.add(t)
    db.session.commit()
    return jsonify({"id": t.id, "message": "Template created successfully"}), 201

@bp.route('/<int:id>', methods=['PUT'])
def update_template(id):
    from sqlalchemy.orm.attributes import flag_modified
    
    t = Template.query.get_or_404(id)
    data = request.json
    
    # Save current state to versions history before updating
    save_version = data.get('save_version', False)
    if save_version:
        current_version = {
            "timestamp": t.updated_at.isoformat(),
            "name": t.name,
            "subject_line": t.subject_line,
            "preheader": t.preheader,
            "json_content": t.json_content
        }
        # Avoid mutable JSON issues by replacing the list
        versions = t.versions_json or []
        versions.append(current_version)
        t.versions_json = list(versions)
        flag_modified(t, "versions_json")
    
    if 'name' in data: t.name = data['name']
    if 'category' in data: t.category = data['category']
    if 'subject_line' in data: t.subject_line = data['subject_line']
    if 'preheader' in data: t.preheader = data['preheader']
    if 'thumbnail' in data: t.thumbnail = data['thumbnail']
    if 'html_content' in data: t.html_content = data['html_content']
    if 'json_content' in data: 
        t.json_content = data['json_content']
        flag_modified(t, "json_content")
    
    db.session.commit()
    return jsonify({"message": "Template updated successfully"})

@bp.route('/<int:id>', methods=['DELETE'])
def delete_template(id):
    t = Template.query.get_or_404(id)
    db.session.delete(t)
    db.session.commit()
    return jsonify({"message": "Template deleted successfully"})

@bp.route('/ai-generate', methods=['POST'])
def ai_generate_template():
    data = request.json
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400
        
    generated_json = generate_email_template(prompt)
    if not generated_json:
        return jsonify({"error": "Failed to generate template"}), 500
        
    t = Template(
        name=generated_json.get('name', 'AI Generated Template'),
        category=generated_json.get('category', 'Newsletter'),
        subject_line=generated_json.get('subject_line'),
        preheader=generated_json.get('preheader'),
        json_content=generated_json.get('sections', [])
    )
    db.session.add(t)
    db.session.commit()
    
    return jsonify({
        "id": t.id, 
        "message": "Template generated successfully",
        "template": generated_json
    })

@bp.route('/ai-rewrite', methods=['POST'])
def ai_rewrite_block():
    data = request.json
    content = data.get('content')
    instructions = data.get('instructions')
    tone = data.get('tone', 'Professional')
    
    if not content or not instructions:
        return jsonify({"error": "Content and instructions are required"}), 400
        
    rewritten_content = rewrite_template_block(content, instructions, tone)
    return jsonify({"content": rewritten_content})

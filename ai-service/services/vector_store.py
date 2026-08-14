import os
from typing import Optional
from langchain_core.documents import Document

_embeddings_cache = None

def _get_embeddings():
    global _embeddings_cache
    if _embeddings_cache is not None:
        return _embeddings_cache

    # 1. Primary: Try FastEmbed (Local ONNX, zero API cost, BAAI/bge-small-en-v1.5)
    try:
        from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
        embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
        # Quick test to verify model works
        embeddings.embed_query("test query")
        _embeddings_cache = embeddings
        return _embeddings_cache
    except Exception as e:
        print(f"FastEmbed initialization warning: {e}")

    # 2. Fallback: GoogleGenerativeAIEmbeddings
    api_key = os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("CHATBOT_API_KEY")
    if api_key:
        for model_name in ["models/text-embedding-004", "models/embedding-001"]:
            try:
                from langchain_google_genai import GoogleGenerativeAIEmbeddings
                embeddings = GoogleGenerativeAIEmbeddings(model=model_name, google_api_key=api_key)
                embeddings.embed_query("test query")
                _embeddings_cache = embeddings
                return _embeddings_cache
            except Exception as ex:
                print(f"Gemini embedding model {model_name} failed: {ex}")

    print("Warning: No working embedding model found.")
    return None

def get_vectorstore(collection_name="ecommerce_data"):
    # Read Qdrant credentials from environment
    qdrant_url = os.getenv("QUADRANT_ENDPOINT_URL") or os.getenv("QDRANT_ENDPOINT_URL") or os.getenv("QDRANT_URL")
    qdrant_key = os.getenv("QUADRANT_API_KEY") or os.getenv("QDRANT_API_KEY")

    embeddings = _get_embeddings()
    if not embeddings:
        print("Warning: No embedding provider available. Vectorstore disabled.")
        return None

    # Primary: Qdrant Cloud VectorStore
    if qdrant_url and qdrant_key:
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.models import VectorParams, Distance
            client = QdrantClient(url=qdrant_url, api_key=qdrant_key)

            # Ensure collection exists before querying/storing (FastEmbed bge-small is 384 dim)
            try:
                if not client.collection_exists(collection_name):
                    client.create_collection(
                        collection_name=collection_name,
                        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
                    )
            except Exception as collection_err:
                print(f"Qdrant collection creation check notice: {collection_err}")

            try:
                from langchain_qdrant import QdrantVectorStore
                return QdrantVectorStore(
                    client=client,
                    collection_name=collection_name,
                    embedding=embeddings
                )
            except ImportError:
                from langchain_community.vectorstores import Qdrant
                return Qdrant(
                    client=client,
                    collection_name=collection_name,
                    embeddings=embeddings
                )
        except Exception as e:
            print(f"Qdrant Cloud vectorstore connection error (falling back to Chroma): {e}")

    # Secondary Fallback: Local ChromaDB
    try:
        from langchain_chroma import Chroma
        chroma_path = os.path.join(os.path.dirname(__file__), "..", "models", "chroma_db")
        return Chroma(
            collection_name=collection_name,
            embedding_function=embeddings,
            persist_directory=chroma_path
        )
    except Exception as e:
        print(f"ChromaDB fallback error: {e}")
        return None

def ingest_data(data_list, data_type="product", collection_name="ecommerce_data"):
    """
    Ingests raw dictionaries into the vector store.
    data_list: list of dictionaries representing products, competitors, or alerts.
    """
    if not data_list:
        return 0
        
    try:
        store = get_vectorstore(collection_name)
        if not store:
            return 0

        docs = []
        ids = []
        
        for item in data_list:
            content_parts = []
            for k, v in item.items():
                if k not in ['_id', 'id'] and v is not None:
                    content_parts.append(f"{k}: {v}")
                    
            content = " | ".join(content_parts)
            doc_id = str(item.get("sku", item.get("id", item.get("_id", hash(content)))))
            
            doc = Document(
                page_content=content,
                metadata={"type": data_type, "id": doc_id}
            )
            docs.append(doc)
            ids.append(f"{data_type}_{doc_id}")
            
        if docs:
            store.add_documents(documents=docs, ids=ids)
            
        return len(docs)
    except Exception as e:
        print(f"Vectorstore ingest warning (non-fatal): {e}")
        return 0

def get_retriever(k=3, collection_name="ecommerce_data"):
    try:
        store = get_vectorstore(collection_name)
        if store:
            return store.as_retriever(search_kwargs={"k": k})
    except Exception as e:
        print(f"Vectorstore retriever warning: {e}")
    return None
